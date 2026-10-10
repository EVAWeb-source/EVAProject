import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { ReservationsService } from '../reservations/reservations.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reservations: ReservationsService,
    private readonly notifications: NotificationsService,
  ) {}

  async startDemo(orderNumber: string) {
    await this.reservations.releaseExpired();

    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: {
        reservations: true,
        invoice: true,
        lines: true,
        payments: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!order) throw new NotFoundException('Order not found');

    if (order.status === 'PAID') {
      const succeeded = order.payments.find(
        (payment) => payment.status === 'SUCCEEDED',
      );
      if (!succeeded) throw new ConflictException('Order is already paid');
      return this.getDemo(succeeded.token);
    }

    if (order.status === 'CANCELLED') {
      throw new ConflictException('Order is cancelled');
    }

    if (
      order.reservations.length === 0 ||
      order.reservations.some((reservation) => reservation.status !== 'ACTIVE')
    ) {
      throw new ConflictException('Order reservations are not active');
    }

    if (
      order.reservations.some(
        (reservation) => reservation.expiresAt.getTime() <= Date.now(),
      )
    ) {
      await this.reservations.releaseExpired();
      throw new ConflictException('Order reservation has expired');
    }

    const existing = order.payments.find(
      (payment) => payment.status === 'INITIATED',
    );
    if (existing) return this.getDemo(existing.token);

    const payment = await this.prisma.paymentAttempt.create({
      data: {
        token: randomUUID(),
        orderId: order.id,
        provider: 'DEMO',
        amountToman: order.totalToman,
      },
    });

    return this.getDemo(payment.token);
  }

  async getDemo(token: string) {
    await this.reservations.releaseExpired();

    const payment = await this.prisma.paymentAttempt.findUnique({
      where: { token },
      include: {
        order: {
          include: {
            reservations: true,
            invoice: true,
            lines: true,
          },
        },
      },
    });

    if (!payment) throw new NotFoundException('Payment not found');
    return this.toPublicPayment(payment);
  }

  async succeedDemo(token: string) {
    await this.reservations.releaseExpired();

    const payment = await this.prisma.paymentAttempt.findUnique({
      where: { token },
      include: {
        order: {
          include: {
            reservations: true,
            invoice: true,
            lines: true,
          },
        },
      },
    });

    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status === 'SUCCEEDED') return this.getDemo(token);
    if (payment.status !== 'INITIATED') {
      throw new ConflictException('Payment is not active');
    }

    const order = payment.order;
    const reservations = order.reservations;
    const lines = order.lines;

    if (order.status !== 'PENDING_PAYMENT') {
      throw new ConflictException('Order is not pending payment');
    }
    if (
      reservations.length === 0 ||
      reservations.some((reservation) => reservation.status !== 'ACTIVE')
    ) {
      throw new ConflictException('Reservations are not active');
    }
    if (
      reservations.some(
        (reservation) => reservation.expiresAt.getTime() <= Date.now(),
      )
    ) {
      await this.reservations.releaseExpired();
      throw new ConflictException('Reservation has expired');
    }
    if (lines.length === 0) throw new ConflictException('Order items are missing');
    if (lines.length !== reservations.length) {
      throw new ConflictException('Order reservation count does not match items');
    }

    const referenceId = `DEMO-${randomUUID()}`;
    const invoiceNumber = order.orderNumber.replace(/^EVA-/, 'EVA-INV-');
    const verificationCode = randomUUID();
    const unitIds = lines.map((line) => line.unitId);
    const reservationIds = reservations.map((reservation) => reservation.id);

    await this.prisma.$transaction(async (tx) => {
      const paymentResult = await tx.paymentAttempt.updateMany({
        where: { id: payment.id, status: 'INITIATED' },
        data: { status: 'SUCCEEDED', paidAt: new Date(), referenceId },
      });
      const orderResult = await tx.order.updateMany({
        where: { id: order.id, status: 'PENDING_PAYMENT' },
        data: { status: 'PAID' },
      });
      const unitResult = await tx.physicalUnit.updateMany({
        where: { id: { in: unitIds }, status: 'RESERVED' },
        data: { status: 'SOLD', reservedUntil: null },
      });
      const reservationResult = await tx.reservation.updateMany({
        where: { id: { in: reservationIds }, status: 'ACTIVE' },
        data: { status: 'COMPLETED' },
      });

      if (
        paymentResult.count !== 1 ||
        orderResult.count !== 1 ||
        unitResult.count !== lines.length ||
        reservationResult.count !== reservations.length
      ) {
        throw new ConflictException('Payment finalization conflict');
      }

      await tx.invoice.upsert({
        where: { orderId: order.id },
        update: {},
        create: {
          invoiceNumber,
          verificationCode,
          orderId: order.id,
          customerName: order.customerName,
          customerMobile: order.mobile,
          recipientName: order.recipientName,
          province: order.province,
          city: order.city,
          address: order.address,
          postalCode: order.postalCode,
          paymentProvider: payment.provider,
          paymentReference: referenceId,
          totalToman: order.totalToman,
          lines: {
            create: order.lines.map((item) => ({
              productNameFa: item.productNameFa,
              masterSku: item.masterSku,
              unitSku: item.unitSku,
              exactWeightGram: item.exactWeightGram,
              purity: item.purity,
              goldRateTomanPerGram: item.goldRateTomanPerGram,
              goldValueToman: item.goldValueToman,
              makingToman: item.makingToman,
              profitToman: item.profitToman,
              taxToman: item.taxToman,
              finalPriceToman: item.unitPriceToman,
              rateVersion: item.rateVersion,
              pricingFormulaVersion: item.pricingFormulaVersion,
              pricingRuleId: item.pricingRuleId,
            })),
          },
        },
      });
    });

    await this.notifications.orderPaid({
      id: order.id,
      orderNumber: order.orderNumber,
      mobile: order.mobile,
    });

    return this.getDemo(token);
  }

  async failDemo(token: string) {
    await this.reservations.releaseExpired();

    const payment = await this.prisma.paymentAttempt.findUnique({
      where: { token },
      include: {
        order: {
          include: {
            reservations: true,
            invoice: true,
            lines: true,
          },
        },
      },
    });

    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status === 'FAILED') return this.toPublicPayment(payment);
    if (payment.status === 'SUCCEEDED') {
      throw new ConflictException('Successful payment cannot be failed');
    }
    if (payment.status !== 'INITIATED') {
      throw new ConflictException('Payment is not active');
    }

    const order = payment.order;
    const reservationIds = order.reservations.map(
      (reservation) => reservation.id,
    );
    const unitIds = order.lines.map((line) => line.unitId);

    await this.prisma.$transaction(async (tx) => {
      await tx.paymentAttempt.updateMany({
        where: { id: payment.id, status: 'INITIATED' },
        data: { status: 'FAILED', failureCode: 'DEMO_DECLINED' },
      });

      await tx.order.updateMany({
        where: { id: order.id, status: 'PENDING_PAYMENT' },
        data: { status: 'CANCELLED' },
      });

      if (reservationIds.length) {
        await tx.reservation.updateMany({
          where: { id: { in: reservationIds }, status: 'ACTIVE' },
          data: { status: 'RELEASED' },
        });
      }

      if (unitIds.length) {
        await tx.physicalUnit.updateMany({
          where: { id: { in: unitIds }, status: 'RESERVED' },
          data: { status: 'AVAILABLE', reservedUntil: null },
        });
      }
    });

    return this.getDemo(token);
  }

  private toPublicPayment(payment: any) {
    const order = payment.order;
    const reservations = order.reservations ?? [];
    const invoice = order.invoice ?? null;
    const items = (order.lines ?? []).map((line: any) => ({
      name: line.productNameFa,
      unitSku: line.unitSku,
      weightGram: String(line.exactWeightGram),
      purity: line.purity,
      priceToman: Number(line.unitPriceToman),
    }));
    const activeReservations = reservations.filter(
      (reservation: any) => reservation.status === 'ACTIVE',
    );
    const expiresAt = activeReservations.length
      ? new Date(
          Math.min(
            ...activeReservations.map((reservation: any) =>
              new Date(reservation.expiresAt).getTime(),
            ),
          ),
        )
      : reservations[0]?.expiresAt ?? null;
    const remainingSeconds = expiresAt
      ? Math.max(
          0,
          Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000),
        )
      : 0;
    const reservationStatus =
      activeReservations.length === reservations.length && reservations.length > 0
        ? 'ACTIVE'
        : reservations.length > 0 &&
            reservations.every((reservation: any) => reservation.status === 'COMPLETED')
          ? 'COMPLETED'
          : reservations[0]?.status ?? null;

    return {
      token: payment.token,
      provider: payment.provider,
      status: payment.status,
      amountToman: Number(payment.amountToman),
      referenceId: payment.referenceId,
      paidAt: payment.paidAt,
      failureCode: payment.failureCode,
      invoice: invoice
        ? {
            invoiceNumber: invoice.invoiceNumber,
            verificationCode: invoice.verificationCode,
          }
        : null,
      order: {
        number: order.orderNumber,
        status: order.status,
        totalToman: Number(order.totalToman),
        customerName: order.customerName,
        item: items[0] ?? null,
        items,
      },
      reservation: reservations.length
        ? {
            status: reservationStatus,
            expiresAt,
            remainingSeconds,
            count: reservations.length,
          }
        : null,
    };
  }
}
