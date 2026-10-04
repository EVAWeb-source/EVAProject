import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AdminCustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
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

  private async syncHistoricalOrders() {
    const orders = await this.prisma.order.findMany({
      where: { customerId: null },
      select: { id: true, mobile: true, customerName: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    if (orders.length === 0) return 0;

    const groups = new Map<string, { name: string; ids: string[] }>();
    for (const order of orders) {
      const group = groups.get(order.mobile);
      if (group) group.ids.push(order.id);
      else groups.set(order.mobile, { name: order.customerName, ids: [order.id] });
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
        data: { customerId: customer.id },
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
