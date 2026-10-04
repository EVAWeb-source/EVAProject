import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AdminAuditService } from './admin-audit.service.js';

@Injectable()
export class AdminOperationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AdminAuditService,
  ) {}

  async overview() {
    const now = Date.now();
    const stalePendingAt = new Date(now - 15 * 60 * 1000);
    const fulfillmentAt = new Date(now - 24 * 60 * 60 * 1000);

    const [
      activeProducts,
      stalePendingOrders,
      overdueFulfillment,
      readyToShip,
      requestedAfterSales,
      refundPending,
      qcPendingCases,
      qcPendingUnits,
      qualityHoldUnits,
      returnedUnits,
      recentAudit,
    ] = await Promise.all([
      this.prisma.masterProduct.findMany({
        where: { status: 'ACTIVE' },
        select: {
          id: true,
          nameFa: true,
          masterSku: true,
          units: { where: { status: 'AVAILABLE' }, select: { id: true } },
        },
        orderBy: { nameFa: 'asc' },
      }),
      this.prisma.order.count({
        where: { status: 'PENDING_PAYMENT', createdAt: { lte: stalePendingAt } },
      }),
      this.prisma.order.count({
        where: {
          status: 'PAID',
          fulfillmentStatus: { in: ['REGISTERED', 'PREPARING'] },
          updatedAt: { lte: fulfillmentAt },
        },
      }),
      this.prisma.order.count({ where: { status: 'PAID', fulfillmentStatus: 'READY_TO_SHIP' } }),
      this.prisma.afterSalesCase.count({ where: { status: 'REQUESTED' } }),
      this.prisma.afterSalesCase.count({ where: { status: 'REFUND_PENDING' } }),
      this.prisma.afterSalesCase.count({ where: { status: 'QC_PENDING' } }),
      this.prisma.physicalUnit.count({ where: { status: 'QC_PENDING' } }),
      this.prisma.physicalUnit.count({ where: { status: 'QUALITY_HOLD' } }),
      this.prisma.physicalUnit.count({ where: { status: 'RETURNED' } }),
      this.audit.recent(8),
    ]);

    const lowStockProducts = activeProducts
      .filter((product) => product.units.length <= 1)
      .map((product) => ({
        id: product.id,
        nameFa: product.nameFa,
        masterSku: product.masterSku,
        availableUnits: product.units.length,
      }));

    const alerts = [
      {
        key: 'stale-payments',
        severity: stalePendingOrders > 0 ? 'warning' : 'ok',
        title: 'سفارش‌های معطل در پرداخت',
        detail: 'بیش از ۱۵ دقیقه در وضعیت انتظار پرداخت مانده‌اند.',
        count: stalePendingOrders,
        href: '/orders',
      },
      {
        key: 'fulfillment-overdue',
        severity: overdueFulfillment > 0 ? 'danger' : 'ok',
        title: 'سفارش‌های معطل در آماده‌سازی',
        detail: 'بیش از ۲۴ ساعت در مراحل ابتدایی Fulfillment مانده‌اند.',
        count: overdueFulfillment,
        href: '/fulfillment',
      },
      {
        key: 'after-sales',
        severity: requestedAfterSales + refundPending + qcPendingCases > 0 ? 'warning' : 'ok',
        title: 'پرونده‌های After Sales باز',
        detail: `${requestedAfterSales} درخواست • ${refundPending} بازپرداخت • ${qcPendingCases} QC`,
        count: requestedAfterSales + refundPending + qcPendingCases,
        href: '/after-sales',
      },
      {
        key: 'inventory-hold',
        severity: qcPendingUnits + qualityHoldUnits + returnedUnits > 0 ? 'warning' : 'ok',
        title: 'Unitهای نیازمند توجه',
        detail: `${qcPendingUnits} QC • ${qualityHoldUnits} Hold • ${returnedUnits} Returned`,
        count: qcPendingUnits + qualityHoldUnits + returnedUnits,
        href: '/inventory',
      },
      {
        key: 'low-stock',
        severity: lowStockProducts.length > 0 ? 'warning' : 'ok',
        title: 'محصولات با موجودی کم',
        detail: 'محصول فعال با صفر یا یک Unit قابل فروش.',
        count: lowStockProducts.length,
        href: '/inventory',
      },
    ];

    return {
      generatedAt: new Date().toISOString(),
      metrics: {
        readyToShip,
        stalePendingOrders,
        overdueFulfillment,
        openAfterSales: requestedAfterSales + refundPending + qcPendingCases,
        inventoryAttention: qcPendingUnits + qualityHoldUnits + returnedUnits,
        lowStockProducts: lowStockProducts.length,
      },
      alerts,
      lowStockProducts,
      recentAudit: recentAudit.map((item) => ({
        ...item,
        createdAt: item.createdAt,
      })),
    };
  }
}
