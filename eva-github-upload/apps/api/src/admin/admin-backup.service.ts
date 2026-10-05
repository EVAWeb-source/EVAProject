import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';

const BACKUP_FORMAT = 'EVA_BUSINESS_BACKUP';
const BACKUP_FORMAT_VERSION = 1;
const BACKUP_SCHEMA_VERSION = 'eva-commerce-schema-2026-10-05';

@Injectable()
export class AdminBackupService {
  constructor(private readonly prisma: PrismaService) {}

  async status() {
    const counts = await this.counts();
    return {
      generatedAt: new Date().toISOString(),
      format: BACKUP_FORMAT,
      formatVersion: BACKUP_FORMAT_VERSION,
      schemaVersion: BACKUP_SCHEMA_VERSION,
      counts,
      excludedForSecurity: ['OtpChallenge', 'CustomerSession'],
      restorePolicy: 'EMPTY_DATABASE_ONLY',
    };
  }

  async exportSnapshot() {
    const [
      collections,
      products,
      productImages,
      units,
      goldRates,
      pricingRules,
      customers,
      orders,
      orderLines,
      reservations,
      paymentAttempts,
      invoices,
      invoiceLines,
      afterSalesCases,
      smsNotifications,
      adminAuditLogs,
    ] = await Promise.all([
      this.prisma.collection.findMany({ orderBy: { id: 'asc' } }),
      this.prisma.masterProduct.findMany({ orderBy: { id: 'asc' } }),
      this.prisma.productImage.findMany({ orderBy: { id: 'asc' } }),
      this.prisma.physicalUnit.findMany({ orderBy: { id: 'asc' } }),
      this.prisma.goldRate.findMany({ orderBy: { id: 'asc' } }),
      this.prisma.pricingRule.findMany({ orderBy: { id: 'asc' } }),
      this.prisma.customer.findMany({ orderBy: { id: 'asc' } }),
      this.prisma.order.findMany({ orderBy: { id: 'asc' } }),
      this.prisma.orderLine.findMany({ orderBy: { id: 'asc' } }),
      this.prisma.reservation.findMany({ orderBy: { id: 'asc' } }),
      this.prisma.paymentAttempt.findMany({ orderBy: { id: 'asc' } }),
      this.prisma.invoice.findMany({ orderBy: { id: 'asc' } }),
      this.prisma.invoiceLine.findMany({ orderBy: { id: 'asc' } }),
      this.prisma.afterSalesCase.findMany({ orderBy: { id: 'asc' } }),
      this.prisma.smsNotification.findMany({ orderBy: { id: 'asc' } }),
      this.prisma.adminAuditLog.findMany({ orderBy: { id: 'asc' } }),
    ]);

    const data = this.normalize({
      Collection: collections,
      MasterProduct: products,
      ProductImage: productImages,
      PhysicalUnit: units,
      GoldRate: goldRates,
      PricingRule: pricingRules,
      Customer: customers,
      Order: orders,
      OrderLine: orderLines,
      Reservation: reservations,
      PaymentAttempt: paymentAttempts,
      Invoice: invoices,
      InvoiceLine: invoiceLines,
      AfterSalesCase: afterSalesCases,
      SmsNotification: smsNotifications,
      AdminAuditLog: adminAuditLogs,
    });

    const counts = Object.fromEntries(
      Object.entries(data).map(([table, rows]) => [table, Array.isArray(rows) ? rows.length : 0]),
    );
    const payloadJson = JSON.stringify(data);
    const checksumSha256 = createHash('sha256').update(payloadJson).digest('hex');
    const createdAt = new Date().toISOString();

    return {
      manifest: {
        format: BACKUP_FORMAT,
        formatVersion: BACKUP_FORMAT_VERSION,
        schemaVersion: BACKUP_SCHEMA_VERSION,
        createdAt,
        checksumAlgorithm: 'SHA-256',
        checksumSha256,
        counts,
        excludedForSecurity: ['OtpChallenge', 'CustomerSession'],
        containsPersonalData: true,
        restorePolicy: 'EMPTY_DATABASE_ONLY',
      },
      data,
    };
  }

  private async counts() {
    const values = await Promise.all([
      this.prisma.collection.count(),
      this.prisma.masterProduct.count(),
      this.prisma.productImage.count(),
      this.prisma.physicalUnit.count(),
      this.prisma.goldRate.count(),
      this.prisma.pricingRule.count(),
      this.prisma.customer.count(),
      this.prisma.order.count(),
      this.prisma.orderLine.count(),
      this.prisma.reservation.count(),
      this.prisma.paymentAttempt.count(),
      this.prisma.invoice.count(),
      this.prisma.invoiceLine.count(),
      this.prisma.afterSalesCase.count(),
      this.prisma.smsNotification.count(),
      this.prisma.adminAuditLog.count(),
    ]);
    const names = [
      'Collection', 'MasterProduct', 'ProductImage', 'PhysicalUnit', 'GoldRate', 'PricingRule',
      'Customer', 'Order', 'OrderLine', 'Reservation', 'PaymentAttempt', 'Invoice', 'InvoiceLine',
      'AfterSalesCase', 'SmsNotification', 'AdminAuditLog',
    ];
    return Object.fromEntries(names.map((name, index) => [name, values[index]]));
  }

  private normalize<T>(value: T): T {
    return JSON.parse(
      JSON.stringify(value, (_key, item) => typeof item === 'bigint' ? item.toString() : item),
    ) as T;
  }
}
