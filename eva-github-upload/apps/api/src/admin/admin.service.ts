import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard() {
    const [
      products,
      units,
      orders,
      invoices,
      activeProductCount,
      availableUnitCount,
      reservedUnitCount,
      soldUnitCount,
      paidOrderCount,
      pendingOrderCount,
      cancelledOrderCount,
      invoiceCount,
      paidRevenue,
      latestRate,
      activeRule,
    ] = await Promise.all([
      this.prisma.masterProduct.findMany({
        include: {
          collection: true,
          units: { orderBy: { exactWeightGram: 'asc' } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.physicalUnit.findMany({
        include: { product: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.findMany({
        take: 30,
        include: {
          lines: true,
          payments: { orderBy: { createdAt: 'desc' }, take: 1 },
          invoice: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.invoice.findMany({
        take: 30,
        include: { lines: true },
        orderBy: { issuedAt: 'desc' },
      }),
      this.prisma.masterProduct.count({ where: { status: 'ACTIVE' } }),
      this.prisma.physicalUnit.count({ where: { status: 'AVAILABLE' } }),
      this.prisma.physicalUnit.count({ where: { status: 'RESERVED' } }),
      this.prisma.physicalUnit.count({ where: { status: 'SOLD' } }),
      this.prisma.order.count({ where: { status: 'PAID' } }),
      this.prisma.order.count({ where: { status: 'PENDING_PAYMENT' } }),
      this.prisma.order.count({ where: { status: 'CANCELLED' } }),
      this.prisma.invoice.count({ where: { status: 'ISSUED' } }),
      this.prisma.order.aggregate({
        where: { status: 'PAID' },
        _sum: { totalToman: true },
      }),
      this.prisma.goldRate.findFirst({
        where: { purity: 18 },
        orderBy: { observedAt: 'desc' },
      }),
      this.prisma.pricingRule.findFirst({
        where: { isActive: true },
        orderBy: { updatedAt: 'desc' },
      }),
    ]);

    return {
      generatedAt: new Date().toISOString(),
      summary: {
        activeProducts: activeProductCount,
        units: {
          available: availableUnitCount,
          reserved: reservedUnitCount,
          sold: soldUnitCount,
          total: units.length,
        },
        orders: {
          paid: paidOrderCount,
          pending: pendingOrderCount,
          cancelled: cancelledOrderCount,
        },
        invoices: invoiceCount,
        paidRevenueToman: Number(paidRevenue._sum.totalToman ?? 0n),
      },
      pricing: {
        rate: latestRate
          ? {
              purity: latestRate.purity,
              tomanPerGram: Number(latestRate.irrPerGram) / 10,
              source: latestRate.source,
              rateVersion: latestRate.rateVersion,
              observedAt: latestRate.observedAt,
            }
          : null,
        rule: activeRule
          ? {
              id: activeRule.id,
              name: activeRule.name,
              formulaVersion: activeRule.formulaVersion,
              makingPercent: Number(activeRule.makingPercent),
              profitPercent: Number(activeRule.profitPercent),
              taxPercent: Number(activeRule.taxPercent),
              updatedAt: activeRule.updatedAt,
            }
          : null,
      },
      products: products.map((product) => ({
        id: product.id,
        nameFa: product.nameFa,
        slug: product.slug,
        masterSku: product.masterSku,
        purity: product.purity,
        status: product.status,
        collection: product.collection?.nameFa ?? null,
        unitCount: product.units.length,
        availableCount: product.units.filter((unit) => unit.status === 'AVAILABLE').length,
        units: product.units.map((unit) => ({
          id: unit.id,
          unitSku: unit.unitSku,
          exactWeightGram: unit.exactWeightGram.toString(),
          currentPriceToman: unit.currentPriceToman === null ? null : Number(unit.currentPriceToman),
          status: unit.status,
          reservedUntil: unit.reservedUntil,
        })),
      })),
      units: units.map((unit) => ({
        id: unit.id,
        unitSku: unit.unitSku,
        productNameFa: unit.product.nameFa,
        masterSku: unit.product.masterSku,
        exactWeightGram: unit.exactWeightGram.toString(),
        currentPriceToman: unit.currentPriceToman === null ? null : Number(unit.currentPriceToman),
        status: unit.status,
        reservedUntil: unit.reservedUntil,
        updatedAt: unit.updatedAt,
      })),
      orders: orders.map((order) => {
        const line = order.lines[0] ?? null;
        const payment = order.payments[0] ?? null;
        return {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          customerName: order.customerName,
          mobile: order.mobile,
          city: order.city,
          totalToman: Number(order.totalToman),
          createdAt: order.createdAt,
          item: line
            ? {
                productNameFa: line.productNameFa,
                unitSku: line.unitSku,
                exactWeightGram: line.exactWeightGram.toString(),
              }
            : null,
          payment: payment
            ? {
                provider: payment.provider,
                status: payment.status,
                referenceId: payment.referenceId,
                paidAt: payment.paidAt,
              }
            : null,
          invoiceNumber: order.invoice?.invoiceNumber ?? null,
        };
      }),
      invoices: invoices.map((invoice) => ({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        orderId: invoice.orderId,
        status: invoice.status,
        customerName: invoice.customerName,
        customerMobile: invoice.customerMobile,
        totalToman: Number(invoice.totalToman),
        verificationCode: invoice.verificationCode,
        issuedAt: invoice.issuedAt,
        item: invoice.lines[0]
          ? {
              productNameFa: invoice.lines[0].productNameFa,
              unitSku: invoice.lines[0].unitSku,
            }
          : null,
      })),
    };
  }
}
