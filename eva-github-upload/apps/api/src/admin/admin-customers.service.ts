import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { tryNormalizeIranMobile } from '../common/normalize-mobile.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AdminCustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    await this.normalizeAndMergeCustomers();
    await this.syncHistoricalOrders();

    const customers = await this.prisma.customer.findMany({
      include: {
        orders: {
          select: { id: true, status: true, totalToman: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const items = customers.map((customer) => {
      const paid = customer.orders.filter((order) => order.status === 'PAID');
      const refunded = customer.orders.filter((order) => order.status === 'REFUNDED');
      return {
        id: customer.id,
        mobile: customer.mobile,
        name: customer.name,
        internalNote: customer.internalNote,
        orderCount: customer.orders.length,
        paidOrderCount: paid.length,
        refundedOrderCount: refunded.length,
        totalPaidToman: paid.reduce((sum, order) => sum + Number(order.totalToman), 0),
        lastOrderAt: customer.orders[0]?.createdAt ?? null,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
      };
    });

    return {
      generatedAt: new Date().toISOString(),
      summary: {
        total: items.length,
        withOrders: items.filter((item) => item.orderCount > 0).length,
        repeatCustomers: items.filter((item) => item.orderCount > 1).length,
        totalPaidToman: items.reduce((sum, item) => sum + item.totalPaidToman, 0),
      },
      items,
    };
  }

  async detail(id: string) {
    await this.normalizeAndMergeCustomers();
    await this.syncHistoricalOrders();

    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        orders: {
          include: {
            lines: true,
            payments: { orderBy: { createdAt: 'desc' }, take: 1 },
            invoice: true,
            afterSalesCases: { orderBy: { createdAt: 'desc' } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!customer) throw new NotFoundException('Customer not found');

    const paid = customer.orders.filter((order) => order.status === 'PAID');
    return {
      id: customer.id,
      mobile: customer.mobile,
      name: customer.name,
      internalNote: customer.internalNote,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
      summary: {
        orderCount: customer.orders.length,
        paidOrderCount: paid.length,
        refundedOrderCount: customer.orders.filter((order) => order.status === 'REFUNDED').length,
        totalPaidToman: paid.reduce((sum, order) => sum + Number(order.totalToman), 0),
      },
      orders: customer.orders.map((order) => {
        const line = order.lines[0] ?? null;
        const payment = order.payments[0] ?? null;
        const afterSales = order.afterSalesCases[0] ?? null;
        return {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          fulfillmentStatus: order.fulfillmentStatus,
          customerName: order.customerName,
          recipientName: order.recipientName,
          city: order.city,
          province: order.province,
          totalToman: Number(order.totalToman),
          createdAt: order.createdAt,
          paymentStatus: payment?.status ?? null,
          invoiceNumber: order.invoice?.invoiceNumber ?? null,
          invoiceStatus: order.invoice?.status ?? null,
          item: line
            ? {
                productNameFa: line.productNameFa,
                unitSku: line.unitSku,
                exactWeightGram: line.exactWeightGram.toString(),
              }
            : null,
          afterSales: afterSales
            ? { type: afterSales.type, status: afterSales.status, reason: afterSales.reason }
            : null,
        };
      }),
    };
  }

  async update(id: string, input: Record<string, unknown>) {
    const existing = await this.prisma.customer.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Customer not found');

    const data: { name?: string | null; internalNote?: string | null } = {};
    if (input.name !== undefined) data.name = this.optionalText(input.name, 120, 'Name');
    if (input.internalNote !== undefined) data.internalNote = this.optionalText(input.internalNote, 3000, 'Internal note');
    if (Object.keys(data).length === 0) throw new BadRequestException('No customer fields supplied');

    await this.prisma.customer.update({ where: { id }, data });
    return this.detail(id);
  }

  private async normalizeAndMergeCustomers() {
    const customers = await this.prisma.customer.findMany({
      select: {
        id: true,
        mobile: true,
        name: true,
        internalNote: true,
        createdAt: true,
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const groups = new Map<string, typeof customers>();
    for (const customer of customers) {
      const normalized = tryNormalizeIranMobile(customer.mobile);
      if (!normalized) continue;
      const group = groups.get(normalized) ?? [];
      group.push(customer);
      groups.set(normalized, group);
    }

    let merged = 0;
    for (const [mobile, group] of groups) {
      const exact = group.find((customer) => customer.mobile === mobile);
      const canonical = exact ?? [...group].sort((a, b) => {
        const noteDelta = Number(Boolean(b.internalNote)) - Number(Boolean(a.internalNote));
        if (noteDelta !== 0) return noteDelta;
        const orderDelta = b._count.orders - a._count.orders;
        if (orderDelta !== 0) return orderDelta;
        return a.createdAt.getTime() - b.createdAt.getTime();
      })[0];

      const duplicates = group.filter((customer) => customer.id !== canonical.id);
      const notes = [...new Set(group.map((customer) => customer.internalNote?.trim()).filter((note): note is string => Boolean(note)))];
      const mergedNote = notes.length > 0 ? notes.join('\n\n—\n\n') : null;
      const preferredName = canonical.name ?? group.find((customer) => customer.name)?.name ?? null;

      await this.prisma.$transaction(async (tx) => {
        if (duplicates.length > 0) {
          const duplicateIds = duplicates.map((customer) => customer.id);
          await tx.order.updateMany({
            where: { customerId: { in: duplicateIds } },
            data: { customerId: canonical.id, mobile },
          });
          await tx.customer.deleteMany({ where: { id: { in: duplicateIds } } });
          merged += duplicates.length;
        }

        await tx.customer.update({
          where: { id: canonical.id },
          data: { mobile, name: preferredName, internalNote: mergedNote },
        });
        await tx.order.updateMany({
          where: { customerId: canonical.id, mobile: { not: mobile } },
          data: { mobile },
        });
      });
    }

    return merged;
  }

  private async syncHistoricalOrders() {
    const orders = await this.prisma.order.findMany({
      where: { customerId: null },
      select: { id: true, mobile: true, customerName: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    if (orders.length === 0) return 0;

    const groups = new Map<string, { name: string; ids: string[] }>();
    for (const order of orders) {
      const mobile = tryNormalizeIranMobile(order.mobile);
      if (!mobile) continue;
      const group = groups.get(mobile);
      if (group) group.ids.push(order.id);
      else groups.set(mobile, { name: order.customerName, ids: [order.id] });
    }

    let linked = 0;
    for (const [mobile, group] of groups) {
      const customer = await this.prisma.customer.upsert({
        where: { mobile },
        create: { mobile, name: group.name },
        update: {},
      });
      const result = await this.prisma.order.updateMany({
        where: { id: { in: group.ids }, customerId: null },
        data: { customerId: customer.id, mobile },
      });
      linked += result.count;
    }
    return linked;
  }

  private optionalText(value: unknown, limit: number, field: string) {
    const text = String(value ?? '').trim();
    if (!text) return null;
    if (text.length > limit) throw new BadRequestException(`${field} is too long`);
    return text;
  }
}
