import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PricingService } from '../pricing/pricing.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

const HARD_HOLD_MINUTES = 10;

@Injectable()
export class ReservationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricing: PricingService,
  ) {}

  async releaseExpired() {
    const now = new Date();
    const expired = await this.prisma.reservation.findMany({
      where: { status: 'ACTIVE', expiresAt: { lte: now } },
      select: { id: true, unitId: true, orderId: true },
    });

    if (expired.length === 0) return 0;

    const orderIds = [
      ...new Set(
        expired
          .map((item) => item.orderId)
          .filter((id): id is string => Boolean(id)),
      ),
    ];

    // Once one reservation belonging to an order expires, the whole order hold
    // is considered expired. This keeps multi-item orders atomic from the
    // customer's point of view and avoids leaving sibling units locked.
    const linkedActive = orderIds.length
      ? await this.prisma.reservation.findMany({
          where: { orderId: { in: orderIds }, status: 'ACTIVE' },
          select: { id: true, unitId: true, orderId: true },
        })
      : [];

    const affectedById = new Map(
      [...expired, ...linkedActive].map((item) => [item.id, item]),
    );
    const affected = [...affectedById.values()];
    const ids = affected.map((item) => item.id);
    const unitIds = [...new Set(affected.map((item) => item.unitId))];

    await this.prisma.$transaction([
      this.prisma.reservation.updateMany({
        where: { id: { in: ids }, status: 'ACTIVE' },
        data: { status: 'EXPIRED' },
      }),
      this.prisma.physicalUnit.updateMany({
        where: { id: { in: unitIds }, status: 'RESERVED' },
        data: { status: 'AVAILABLE', reservedUntil: null },
      }),
      this.prisma.order.updateMany({
        where: { id: { in: orderIds }, status: 'PENDING_PAYMENT' },
        data: { status: 'CANCELLED' },
      }),
      this.prisma.paymentAttempt.updateMany({
        where: { orderId: { in: orderIds }, status: 'INITIATED' },
        data: { status: 'EXPIRED', failureCode: 'RESERVATION_EXPIRED' },
      }),
    ]);

    return affected.length;
  }

  async reserve(unitId: string) {
    const batch = await this.reserveMany([unitId]);
    return batch.reservations[0];
  }

  async reserveMany(unitIds: string[]) {
    await this.releaseExpired();

    const uniqueIds = [...new Set(unitIds.filter(Boolean))];
    if (uniqueIds.length === 0) {
      throw new NotFoundException('No units selected');
    }
    if (uniqueIds.length !== unitIds.length) {
      throw new ConflictException('Duplicate units are not allowed');
    }

    const units = await this.prisma.physicalUnit.findMany({
      where: { id: { in: uniqueIds } },
      include: { product: true },
    });

    if (units.length !== uniqueIds.length) {
      throw new NotFoundException('One or more units were not found');
    }

    const unitById = new Map(units.map((unit) => [unit.id, unit]));
    const orderedUnits = uniqueIds.map((id) => unitById.get(id)!);
    const purities = [...new Set(orderedUnits.map((unit) => unit.product.purity))];
    const configPairs = await Promise.all(
      purities.map(async (purity) => [purity, await this.pricing.getCurrentConfig(purity)] as const),
    );
    const configs = new Map(configPairs);
    const quotes = orderedUnits.map((unit) =>
      this.pricing.calculateQuote(unit, configs.get(unit.product.purity)!),
    );

    const now = new Date();
    const expiresAt = new Date(now.getTime() + HARD_HOLD_MINUTES * 60 * 1000);

    const reservations = await this.prisma.$transaction(async (tx) => {
      const created: any[] = [];

      for (let index = 0; index < orderedUnits.length; index += 1) {
        const unit = orderedUnits[index];
        const quote = quotes[index];
        const claim = await tx.physicalUnit.updateMany({
          where: { id: unit.id, status: 'AVAILABLE' },
          data: {
            status: 'RESERVED',
            reservedUntil: expiresAt,
            currentPriceToman: BigInt(quote.finalPriceToman),
          },
        });

        if (claim.count !== 1) {
          throw new ConflictException(
            `Unit ${unit.unitSku} is already reserved or unavailable`,
          );
        }

        const reservation = await tx.reservation.create({
          data: {
            token: randomUUID(),
            unitId: unit.id,
            expiresAt,
            lockedPriceToman: BigInt(quote.finalPriceToman),
            goldRateTomanPerGram: BigInt(quote.goldRateTomanPerGram),
            goldValueToman: BigInt(quote.goldValueToman),
            makingToman: BigInt(quote.makingToman),
            profitToman: BigInt(quote.profitToman),
            taxToman: BigInt(quote.taxToman),
            rateVersion: quote.rateVersion,
            pricingFormulaVersion: quote.pricingFormulaVersion,
            pricingRuleId: quote.pricingRuleId,
          },
          include: { unit: { include: { product: true } } },
        });
        created.push(reservation);
      }

      return created;
    });

    const remainingSeconds = Math.max(
      0,
      Math.floor((expiresAt.getTime() - Date.now()) / 1000),
    );

    return {
      expiresAt,
      remainingSeconds,
      reservations: reservations.map((reservation) =>
        this.toPublicReservation(reservation),
      ),
    };
  }

  async getByToken(token: string) {
    await this.releaseExpired();

    const reservation = await this.prisma.reservation.findUnique({
      where: { token },
      include: { unit: { include: { product: true } } },
    });

    if (!reservation) throw new NotFoundException('Reservation not found');
    return this.toPublicReservation(reservation);
  }

  async release(token: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { token },
    });

    if (!reservation) throw new NotFoundException('Reservation not found');

    if (reservation.status !== 'ACTIVE') {
      return { token, status: reservation.status };
    }

    const group = reservation.orderId
      ? await this.prisma.reservation.findMany({
          where: { orderId: reservation.orderId, status: 'ACTIVE' },
          select: { id: true, unitId: true },
        })
      : [{ id: reservation.id, unitId: reservation.unitId }];

    const reservationIds = group.map((item) => item.id);
    const unitIds = [...new Set(group.map((item) => item.unitId))];

    await this.prisma.$transaction(async (tx) => {
      await tx.reservation.updateMany({
        where: { id: { in: reservationIds }, status: 'ACTIVE' },
        data: { status: 'RELEASED' },
      });

      await tx.physicalUnit.updateMany({
        where: { id: { in: unitIds }, status: 'RESERVED' },
        data: { status: 'AVAILABLE', reservedUntil: null },
      });

      if (reservation.orderId) {
        await tx.order.updateMany({
          where: { id: reservation.orderId, status: 'PENDING_PAYMENT' },
          data: { status: 'CANCELLED' },
        });
        await tx.paymentAttempt.updateMany({
          where: { orderId: reservation.orderId, status: 'INITIATED' },
          data: { status: 'FAILED', failureCode: 'RESERVATION_RELEASED' },
        });
      }
    });

    return { token, status: 'RELEASED', releasedCount: reservationIds.length };
  }

  private toPublicReservation(reservation: any) {
    const remainingSeconds = Math.max(
      0,
      Math.floor((new Date(reservation.expiresAt).getTime() - Date.now()) / 1000),
    );

    const lockedPrice =
      reservation.lockedPriceToman ?? reservation.unit.currentPriceToman;

    return {
      token: reservation.token,
      status: reservation.status,
      expiresAt: reservation.expiresAt,
      remainingSeconds,
      pricing: {
        lockedPriceToman: lockedPrice === null ? null : Number(lockedPrice),
        goldRateTomanPerGram:
          reservation.goldRateTomanPerGram === null
            ? null
            : Number(reservation.goldRateTomanPerGram),
        goldValueToman:
          reservation.goldValueToman === null
            ? null
            : Number(reservation.goldValueToman),
        makingToman:
          reservation.makingToman === null
            ? null
            : Number(reservation.makingToman),
        profitToman:
          reservation.profitToman === null
            ? null
            : Number(reservation.profitToman),
        taxToman:
          reservation.taxToman === null ? null : Number(reservation.taxToman),
        rateVersion: reservation.rateVersion,
        pricingFormulaVersion: reservation.pricingFormulaVersion,
      },
      unit: {
        id: reservation.unit.id,
        unitSku: reservation.unit.unitSku,
        exactWeightGram: reservation.unit.exactWeightGram.toString(),
        priceToman: lockedPrice === null ? null : Number(lockedPrice),
        purity: reservation.unit.product.purity,
        productNameFa: reservation.unit.product.nameFa,
      },
    };
  }
}
