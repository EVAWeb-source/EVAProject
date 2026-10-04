import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

const CLOSED_STATUSES = ['COMPLETED', 'REJECTED'] as const;
const QC_OUTCOMES = ['AVAILABLE', 'QUALITY_HOLD', 'DAMAGED', 'UNAVAILABLE'] as const;

@Injectable()
export class AdminAfterSalesService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const [cases, requested, refundPending, qcPending] = await Promise.all([
      this.prisma.afterSalesCase.findMany({
        take: 100,
        orderBy: { createdAt: 'desc' },
        include: this.caseInclude(),
      }),
      this.prisma.afterSalesCase.count({ where: { status: 'REQUESTED' } }),
      this.prisma.afterSalesCase.count({ where: { status: 'REFUND_PENDING' } }),
      this.prisma.afterSalesCase.count({ where: { status: 'QC_PENDING' } }),
    ]);

    return {
      generatedAt: new Date().toISOString(),
      summary: { total: cases.length, requested, refundPending, qcPending },
      items: cases.map((item) => this.serialize(item)),
    };
  }

  async createCancellation(orderId: string, input: Record<string, unknown>) {
    const reason = this.requiredText(input.reason, 'Reason');
    const note = this.optionalText(input.note);
    await this.ensureNoOpenCase(orderId);

    const order = await this.getOrder(orderId);
    const line = order.lines[0];
    if (!line) throw new ConflictException('Order item is missing');

    if (order.status === 'PENDING_PAYMENT') {
      await this.prisma.$transaction(async (tx) => {
        await tx.afterSalesCase.create({
          data: {
            orderId: order.id,
            unitId: line.unitId,
            type: 'CANCELLATION',
            status: 'COMPLETED',
            reason,
            note,
            refundAmountToman: BigInt(0),
          },
        });
        await tx.order.update({ where: { id: order.id }, data: { status: 'CANCELLED' } });
        if (order.reservation?.status === 'ACTIVE') {
          await tx.reservation.update({ where: { id: order.reservation.id }, data: { status: 'RELEASED' } });
        }
        await tx.physicalUnit.updateMany({
          where: { id: line.unitId, status: 'RESERVED' },
          data: { status: 'AVAILABLE', reservedUntil: null },
        });
        await tx.paymentAttempt.updateMany({
          where: { orderId: order.id, status: 'INITIATED' },
          data: { status: 'FAILED', failureCode: 'ADMIN_CANCELLED' },
        });
      });
      return this.findLatestForOrder(order.id);
    }

    if (order.status !== 'PAID') {
      throw new ConflictException('Only pending-payment or paid orders can be cancelled');
    }
    if (order.fulfillmentStatus === 'SHIPPED' || order.fulfillmentStatus === 'DELIVERED') {
      throw new ConflictException('Shipped orders cannot use cancellation; use the return workflow after delivery');
    }

    const created = await this.prisma.afterSalesCase.create({
      data: {
        orderId: order.id,
        unitId: line.unitId,
        type: 'CANCELLATION',
        status: 'REQUESTED',
        reason,
        note,
        refundAmountToman: order.totalToman,
      },
      include: this.caseInclude(),
    });
    return this.serialize(created);
  }

  async createReturn(orderId: string, input: Record<string, unknown>) {
    const reason = this.requiredText(input.reason, 'Reason');
    const note = this.optionalText(input.note);
    await this.ensureNoOpenCase(orderId);

    const order = await this.getOrder(orderId);
    const line = order.lines[0];
    if (!line) throw new ConflictException('Order item is missing');
    if (order.status !== 'PAID') throw new ConflictException('Only paid orders can enter the return workflow');
    if (order.fulfillmentStatus !== 'DELIVERED') throw new ConflictException('Return can only start after delivery');

    const created = await this.prisma.afterSalesCase.create({
      data: {
        orderId: order.id,
        unitId: line.unitId,
        type: 'RETURN',
        status: 'REQUESTED',
        reason,
        note,
        refundAmountToman: order.totalToman,
      },
      include: this.caseInclude(),
    });
    return this.serialize(created);
  }

  async approve(id: string) {
    const item = await this.getCase(id);
    if (item.status !== 'REQUESTED') throw new ConflictException('Only requested cases can be approved');

    if (item.type === 'CANCELLATION') {
      await this.prisma.$transaction([
        this.prisma.afterSalesCase.update({
          where: { id },
          data: { status: 'REFUND_PENDING', approvedAt: new Date() },
        }),
        this.prisma.order.updateMany({
          where: { id: item.orderId, status: 'PAID' },
          data: { status: 'REFUND_PENDING' },
        }),
      ]);
    } else {
      await this.prisma.afterSalesCase.update({
        where: { id },
        data: { status: 'RETURN_IN_TRANSIT', approvedAt: new Date() },
      });
    }

    return this.getSerializedCase(id);
  }

  async reject(id: string, input: Record<string, unknown>) {
    const item = await this.getCase(id);
    if (item.status !== 'REQUESTED') throw new ConflictException('Only requested cases can be rejected');
    const note = this.optionalText(input.note) ?? item.note;
    await this.prisma.afterSalesCase.update({
      where: { id },
      data: { status: 'REJECTED', rejectedAt: new Date(), note },
    });
    return this.getSerializedCase(id);
  }

  async markReceived(id: string) {
    const item = await this.getCase(id);
    if (item.type !== 'RETURN' || item.status !== 'RETURN_IN_TRANSIT') {
      throw new ConflictException('Only approved returns can be marked as received');
    }

    await this.prisma.$transaction(async (tx) => {
      const changed = await tx.physicalUnit.updateMany({
        where: { id: item.unitId, status: 'SOLD' },
        data: { status: 'RETURNED', reservedUntil: null },
      });
      if (changed.count !== 1) throw new ConflictException('Returned unit is not in SOLD status');
      await tx.afterSalesCase.update({
        where: { id },
        data: { status: 'QC_PENDING', receivedAt: new Date() },
      });
    });

    return this.getSerializedCase(id);
  }

  async completeQc(id: string, input: Record<string, unknown>) {
    const item = await this.getCase(id);
    if (item.status !== 'QC_PENDING') throw new ConflictException('Case is not waiting for QC');

    const outcome = String(input.outcome ?? '').toUpperCase();
    if (!QC_OUTCOMES.includes(outcome as (typeof QC_OUTCOMES)[number])) {
      throw new BadRequestException('Invalid QC outcome');
    }
    const note = this.optionalText(input.note) ?? item.note;

    if (item.type === 'CANCELLATION') {
      await this.prisma.$transaction(async (tx) => {
        const changed = await tx.physicalUnit.updateMany({
          where: { id: item.unitId, status: 'QC_PENDING' },
          data: { status: outcome as any, reservedUntil: null },
        });
        if (changed.count !== 1) throw new ConflictException('Unit is not waiting for cancellation QC');
        await tx.afterSalesCase.update({
          where: { id },
          data: { status: 'COMPLETED', qcOutcome: outcome as any, qcCompletedAt: new Date(), note },
        });
      });
    } else {
      if (item.unit.status !== 'RETURNED') throw new ConflictException('Returned unit must remain in RETURNED status until refund is completed');
      await this.prisma.$transaction([
        this.prisma.afterSalesCase.update({
          where: { id },
          data: { status: 'REFUND_PENDING', qcOutcome: outcome as any, qcCompletedAt: new Date(), note },
        }),
        this.prisma.order.updateMany({
          where: { id: item.orderId, status: 'PAID' },
          data: { status: 'REFUND_PENDING' },
        }),
      ]);
    }

    return this.getSerializedCase(id);
  }

  async markRefunded(id: string, input: Record<string, unknown>) {
    const item = await this.getCase(id);
    if (item.status !== 'REFUND_PENDING') throw new ConflictException('Case is not waiting for refund');
    const refundReference = this.requiredText(input.refundReference, 'Refund reference');

    await this.prisma.$transaction(async (tx) => {
      const payment = await tx.paymentAttempt.updateMany({
        where: { orderId: item.orderId, status: 'SUCCEEDED' },
        data: { status: 'REFUNDED' },
      });
      if (payment.count !== 1) throw new ConflictException('Succeeded payment was not found for refund');

      await tx.invoice.updateMany({
        where: { orderId: item.orderId, status: 'ISSUED' },
        data: { status: 'VOID' },
      });
      await tx.order.updateMany({
        where: { id: item.orderId, status: 'REFUND_PENDING' },
        data: { status: 'REFUNDED' },
      });

      if (item.type === 'CANCELLATION') {
        const unit = await tx.physicalUnit.updateMany({
          where: { id: item.unitId, status: 'SOLD' },
          data: { status: 'QC_PENDING', reservedUntil: null },
        });
        if (unit.count !== 1) throw new ConflictException('Cancelled unit is not in SOLD status');
        await tx.afterSalesCase.update({
          where: { id },
          data: { status: 'QC_PENDING', refundReference, refundedAt: new Date() },
        });
      } else {
        if (!item.qcOutcome) throw new ConflictException('Return QC must be completed before refund');
        const unit = await tx.physicalUnit.updateMany({
          where: { id: item.unitId, status: 'RETURNED' },
          data: { status: item.qcOutcome as any, reservedUntil: null },
        });
        if (unit.count !== 1) throw new ConflictException('Returned unit is not in RETURNED status');
        await tx.afterSalesCase.update({
          where: { id },
          data: { status: 'COMPLETED', refundReference, refundedAt: new Date() },
        });
      }
    });

    return this.getSerializedCase(id);
  }

  private async ensureNoOpenCase(orderId: string) {
    const existing = await this.prisma.afterSalesCase.findFirst({
      where: { orderId, status: { notIn: [...CLOSED_STATUSES] as any } },
      select: { id: true, type: true, status: true },
    });
    if (existing) throw new ConflictException(`Order already has an open ${existing.type} case (${existing.status})`);
  }

  private async getOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        lines: true,
        reservation: true,
        payments: { orderBy: { createdAt: 'desc' } },
        invoice: true,
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  private async getCase(id: string) {
    const item = await this.prisma.afterSalesCase.findUnique({
      where: { id },
      include: this.caseInclude(),
    });
    if (!item) throw new NotFoundException('After-sales case not found');
    return item;
  }

  private async getSerializedCase(id: string) {
    return this.serialize(await this.getCase(id));
  }

  private async findLatestForOrder(orderId: string) {
    const item = await this.prisma.afterSalesCase.findFirst({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
      include: this.caseInclude(),
    });
    if (!item) throw new NotFoundException('After-sales case not found');
    return this.serialize(item);
  }

  private caseInclude() {
    return {
      order: {
        include: {
          lines: true,
          payments: { orderBy: { createdAt: 'desc' as const }, take: 1 },
          invoice: true,
        },
      },
      unit: { include: { product: true } },
    } as const;
  }

  private serialize(item: any) {
    const payment = item.order.payments?.[0] ?? null;
    const line = item.order.lines?.[0] ?? null;
    return {
      id: item.id,
      type: item.type,
      status: item.status,
      reason: item.reason,
      note: item.note,
      refundAmountToman: item.refundAmountToman === null ? null : Number(item.refundAmountToman),
      refundReference: item.refundReference,
      qcOutcome: item.qcOutcome,
      requestedAt: item.requestedAt,
      approvedAt: item.approvedAt,
      receivedAt: item.receivedAt,
      qcCompletedAt: item.qcCompletedAt,
      refundedAt: item.refundedAt,
      rejectedAt: item.rejectedAt,
      order: {
        id: item.order.id,
        orderNumber: item.order.orderNumber,
        status: item.order.status,
        fulfillmentStatus: item.order.fulfillmentStatus,
        customerName: item.order.customerName,
        mobile: item.order.mobile,
        totalToman: Number(item.order.totalToman),
        invoiceNumber: item.order.invoice?.invoiceNumber ?? null,
        invoiceStatus: item.order.invoice?.status ?? null,
        paymentStatus: payment?.status ?? null,
      },
      unit: {
        id: item.unit.id,
        unitSku: item.unit.unitSku,
        status: item.unit.status,
        productNameFa: item.unit.product.nameFa,
        exactWeightGram: item.unit.exactWeightGram.toString(),
      },
      item: line
        ? { productNameFa: line.productNameFa, unitSku: line.unitSku, exactWeightGram: line.exactWeightGram.toString() }
        : null,
    };
  }

  private requiredText(value: unknown, label: string) {
    const text = String(value ?? '').trim();
    if (!text) throw new BadRequestException(`${label} is required`);
    if (text.length > 1000) throw new BadRequestException(`${label} is too long`);
    return text;
  }

  private optionalText(value: unknown) {
    const text = String(value ?? '').trim();
    if (!text) return null;
    if (text.length > 2000) throw new BadRequestException('Note is too long');
    return text;
  }
}
