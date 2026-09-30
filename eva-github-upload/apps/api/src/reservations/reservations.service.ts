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
      select: { id: true, unitId: true },
    });

    if (expired.length === 0) return 0;

    const ids = expired.map((item) => item.id);
    const unitIds = [...new Set(expired.map((item) => item.unitId))];

    await this.prisma.$transaction([
      this.prisma.reservation.updateMany({
        where: { id: { in: ids }, status: 'ACTIVE' },
        data: { status: 'EXPIRED' },
      }),
      this.prisma.physicalUnit.updateMany({
        where: {
          id: { in: unitIds },
          status: 'RESERVED',
          reservedUntil: { lte: now },
        },
        data: { status: 'AVAILABLE', reservedUntil: null },
      }),
    ]);

    return expired.length;
  }

  async reserve(unitId: string) {
    await this.releaseExpired();

    const unit = await this.prisma.physicalUnit.findUnique({
      where: { id: unitId },
      include: { product: true },
    });

    if (!unit) throw new NotFoundException('Unit not found');

    const quote = await this.pricing.priceUnit(unitId, true);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + HARD_HOLD_MINUTES * 60 * 1000);
    const token = randomUUID();

    const reservation = await this.prisma.$transaction(async (tx) => {
      const claim = await tx.physicalUnit.updateMany({
        where: { id: unitId, status: 'AVAILABLE' },
        data: {
          status: 'RESERVED',
          reservedUntil: expiresAt,
          currentPriceToman: BigInt(quote.finalPriceToman),
        },
      });

      if (claim.count !== 1) {
        throw new ConflictException('Unit is already reserved or unavailable');
      }

      return tx.reservation.create({
        data: {
          token,
          unitId,
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
    });

    return this.toPublicReservation(reservation);
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

    await this.prisma.$transaction([
      this.prisma.reservation.update({
        where: { id: reservation.id },
        data: { status: 'RELEASED' },
      }),
      this.prisma.physicalUnit.updateMany({
        where: { id: reservation.unitId, status: 'RESERVED' },
        data: { status: 'AVAILABLE', reservedUntil: null },
      }),
    ]);

    return { token, status: 'RELEASED' };
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
          reservation.makingToman === null ? null : Number(reservation.makingToman),
        profitToman:
          reservation.profitToman === null ? null : Number(reservation.profitToman),
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
