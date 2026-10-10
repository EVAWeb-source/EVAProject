import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomInt } from 'node:crypto';
import { normalizeIranMobile } from '../common/normalize-mobile.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ReservationsService } from '../reservations/reservations.service.js';
import { CreateOrderDto } from './create-order.dto.js';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reservations: ReservationsService,
  ) {}

  async create(dto: CreateOrderDto) {
    await this.reservations.releaseExpired();

    const unitIds = dto.items.map((item) => item.unitId);
    const tokens = dto.items.map((item) => item.reservationToken);
    if (new Set(unitIds).size !== unitIds.length) {
      throw new BadRequestException('Duplicate units are not allowed');
    }
    if (new Set(tokens).size !== tokens.length) {
      throw new BadRequestException('Duplicate reservation tokens are not allowed');
    }

    const reservations = await this.prisma.reservation.findMany({
      where: { token: { in: tokens } },
      include: {
        unit: { include: { product: true } },
        order: { include: { lines: true, payments: true } },
      },
    });

    if (reservations.length !== dto.items.length) {
      throw new NotFoundException('One or more reservations were not found');
    }

    const reservationByToken = new Map(
      reservations.map((reservation) => [reservation.token, reservation]),
    );
    const orderedReservations = dto.items.map((item) => {
      const reservation = reservationByToken.get(item.reservationToken);
      if (!reservation) throw new NotFoundException('Reservation not found');
      if (reservation.unitId !== item.unitId) {
        throw new BadRequestException('Reservation does not match selected unit');
      }
      return reservation;
    });

    const existingOrderIds = [
      ...new Set(
        orderedReservations
          .map((reservation) => reservation.orderId)
          .filter((id): id is string => Boolean(id)),
      ),
    ];

    if (existingOrderIds.length > 0) {
      if (
        existingOrderIds.length === 1 &&
        orderedReservations.every(
          (reservation) => reservation.orderId === existingOrderIds[0],
        )
      ) {
        const existing = orderedReservations[0].order;
        if (existing) return this.toPublicOrder(existing);
      }
      throw new ConflictException('Reservations are already linked to an order');
    }

    const now = Date.now();
    const priced = orderedReservations.map((reservation) => {
      if (reservation.status !== 'ACTIVE') {
        throw new BadRequestException('Reservation is no longer active');
      }
      if (reservation.expiresAt.getTime() <= now) {
        throw new BadRequestException('Reservation has expired');
      }
      if (reservation.unit.status !== 'RESERVED') {
        throw new BadRequestException('Unit is not reserved');
      }

      const lockedPrice =
        reservation.lockedPriceToman ?? reservation.unit.currentPriceToman;
      if (lockedPrice === null) {
        throw new BadRequestException('Reservation does not have a locked price');
      }
      return { reservation, unit: reservation.unit, lockedPrice };
    });

    const mobile = normalizeIranMobile(dto.mobile);
    const customer = await this.prisma.customer.upsert({
      where: { mobile },
      create: { mobile, name: dto.customerName },
      update: { name: dto.customerName },
    });

    const orderNumber = `EVA-${new Date().getUTCFullYear()}-${randomInt(100000, 999999)}`;
    const totalToman = priced.reduce(
      (sum, item) => sum + item.lockedPrice,
      BigInt(0),
    );

    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber,
          status: 'PENDING_PAYMENT',
          isDemo: true,
          customerId: customer.id,
          customerName: dto.customerName,
          mobile,
          province: dto.province,
          city: dto.city,
          address: dto.address,
          postalCode: dto.postalCode,
          recipientName: dto.recipientName,
          isGift: dto.isGift ?? false,
          giftMessage: dto.isGift ? dto.giftMessage?.trim() || null : null,
          hidePriceInPackage: dto.isGift
            ? (dto.hidePriceInPackage ?? true)
            : false,
          totalToman,
          lines: {
            create: priced.map(({ reservation, unit, lockedPrice }) => ({
              unitId: unit.id,
              productNameFa: unit.product.nameFa,
              masterSku: unit.product.masterSku,
              unitSku: unit.unitSku,
              exactWeightGram: unit.exactWeightGram,
              purity: unit.product.purity,
              unitPriceToman: lockedPrice,
              goldRateTomanPerGram: reservation.goldRateTomanPerGram,
              goldValueToman: reservation.goldValueToman,
              makingToman: reservation.makingToman,
              profitToman: reservation.profitToman,
              taxToman: reservation.taxToman,
              rateVersion: reservation.rateVersion,
              pricingFormulaVersion: reservation.pricingFormulaVersion,
              pricingRuleId: reservation.pricingRuleId,
            })),
          },
        },
        include: { lines: true, payments: true },
      });

      const linked = await tx.reservation.updateMany({
        where: {
          id: { in: priced.map(({ reservation }) => reservation.id) },
          status: 'ACTIVE',
          orderId: null,
        },
        data: { orderId: created.id },
      });

      if (linked.count !== priced.length) {
        throw new ConflictException('Could not attach all reservations to order');
      }

      return created;
    });

    return this.toPublicOrder(order);
  }

  async findByNumber(orderNumber: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: { lines: true, payments: { orderBy: { createdAt: 'desc' } } },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.toPublicOrder(order);
  }

  private toPublicOrder(order: {
    id: string;
    orderNumber: string;
    status: string;
    isDemo: boolean;
    isGift: boolean;
    giftMessage: string | null;
    hidePriceInPackage: boolean;
    customerName: string;
    mobile: string;
    totalToman: bigint;
    createdAt: Date;
    lines: Array<{
      productNameFa: string;
      unitSku: string;
      exactWeightGram: unknown;
      purity: number;
      unitPriceToman: bigint;
      goldRateTomanPerGram: bigint | null;
      goldValueToman: bigint | null;
      makingToman: bigint | null;
      profitToman: bigint | null;
      taxToman: bigint | null;
      rateVersion: string | null;
      pricingFormulaVersion: string | null;
    }>;
    payments?: Array<{
      provider: string;
      status: string;
      amountToman: bigint;
      referenceId: string | null;
      failureCode: string | null;
      paidAt: Date | null;
      createdAt: Date;
    }>;
  }) {
    const payment = order.payments?.[0] ?? null;
    const items = order.lines.map((line) => ({
      name: line.productNameFa,
      unitSku: line.unitSku,
      weightGram: String(line.exactWeightGram),
      purity: line.purity,
      priceToman: Number(line.unitPriceToman),
      pricing: {
        goldRateTomanPerGram:
          line.goldRateTomanPerGram === null
            ? null
            : Number(line.goldRateTomanPerGram),
        goldValueToman:
          line.goldValueToman === null ? null : Number(line.goldValueToman),
        makingToman:
          line.makingToman === null ? null : Number(line.makingToman),
        profitToman:
          line.profitToman === null ? null : Number(line.profitToman),
        taxToman: line.taxToman === null ? null : Number(line.taxToman),
        rateVersion: line.rateVersion,
        pricingFormulaVersion: line.pricingFormulaVersion,
      },
    }));

    return {
      id: order.id,
      number: order.orderNumber,
      status: order.status,
      isDemo: order.isDemo,
      totalToman: Number(order.totalToman),
      createdAt: order.createdAt,
      gift: {
        enabled: order.isGift,
        message: order.giftMessage,
        hidePrice: order.hidePriceInPackage,
      },
      payment: payment
        ? {
            provider: payment.provider,
            status: payment.status,
            amountToman: Number(payment.amountToman),
            referenceId: payment.referenceId,
            failureCode: payment.failureCode,
            paidAt: payment.paidAt,
          }
        : null,
      items,
      // Backward-compatible first item for older storefront/admin consumers.
      item: items[0] ?? null,
    };
  }
}
