import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

function startOfUtcDay(date: Date) {
  const next = new Date(date);
  next.setUTCHours(0, 0, 0, 0);
  return next;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function dayKey(value: Date | string) {
  return new Date(value).toISOString().slice(0, 10);
}

function changePercent(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

@Injectable()
export class AdminAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async overview(inputDays?: number) {
    const days = [7, 30, 90].includes(Number(inputDays)) ? Number(inputDays) : 30;
    const end = new Date();
    const start = startOfUtcDay(addDays(end, -(days - 1)));
    const previousStart = startOfUtcDay(addDays(start, -days));

    const [orders, siteEvents, paymentAttempts, refundCases, customerActivity, units] = await Promise.all([
      this.prisma.order.findMany({
        where: { createdAt: { gte: previousStart } },
        include: { lines: true },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.siteEvent.findMany({
        where: { createdAt: { gte: previousStart }, event: 'PAGE_VIEW' },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.paymentAttempt.findMany({
        where: { createdAt: { gte: previousStart } },
        select: { status: true, createdAt: true },
      }),
      this.prisma.afterSalesCase.findMany({
        where: { refundedAt: { gte: previousStart } },
        select: { refundAmountToman: true, refundedAt: true },
      }),
      this.prisma.customer.findMany({
        where: { orders: { some: { status: 'PAID', createdAt: { gte: start } } } },
        select: {
          id: true,
          createdAt: true,
          orders: { where: { status: 'PAID' }, select: { id: true, createdAt: true } },
        },
      }),
      this.prisma.physicalUnit.findMany({
        select: { status: true, currentPriceToman: true },
      }),
    ]);

    const currentOrders = orders.filter((order) => order.createdAt >= start);
    const previousOrders = orders.filter((order) => order.createdAt < start);
    const currentPaid = currentOrders.filter((order) => order.status === 'PAID');
    const previousPaid = previousOrders.filter((order) => order.status === 'PAID');
    const currentRevenue = currentPaid.reduce((sum, order) => sum + Number(order.totalToman), 0);
    const previousRevenue = previousPaid.reduce((sum, order) => sum + Number(order.totalToman), 0);
    const currentAov = currentPaid.length ? Math.round(currentRevenue / currentPaid.length) : 0;
    const previousAov = previousPaid.length ? Math.round(previousRevenue / previousPaid.length) : 0;

    const currentRefunds = refundCases
      .filter((item) => item.refundedAt && item.refundedAt >= start)
      .reduce((sum, item) => sum + Number(item.refundAmountToman ?? 0n), 0);
    const previousRefunds = refundCases
      .filter((item) => item.refundedAt && item.refundedAt < start)
      .reduce((sum, item) => sum + Number(item.refundAmountToman ?? 0n), 0);

    const currentEvents = siteEvents.filter((item) => item.createdAt >= start);
    const previousEvents = siteEvents.filter((item) => item.createdAt < start);
    const currentSessions = new Set(currentEvents.map((item) => item.sessionId));
    const previousSessions = new Set(previousEvents.map((item) => item.sessionId));

    const currentPayments = paymentAttempts.filter((item) => item.createdAt >= start);
    const previousPayments = paymentAttempts.filter((item) => item.createdAt < start);
    const paymentSuccess = currentPayments.filter((item) => item.status === 'SUCCEEDED').length;
    const paymentFinished = currentPayments.filter((item) => ['SUCCEEDED', 'FAILED', 'EXPIRED', 'REFUNDED'].includes(item.status)).length;
    const previousPaymentSuccess = previousPayments.filter((item) => item.status === 'SUCCEEDED').length;
    const previousPaymentFinished = previousPayments.filter((item) => ['SUCCEEDED', 'FAILED', 'EXPIRED', 'REFUNDED'].includes(item.status)).length;
    const paymentSuccessRate = paymentFinished ? Number(((paymentSuccess / paymentFinished) * 100).toFixed(1)) : 0;
    const previousPaymentSuccessRate = previousPaymentFinished ? Number(((previousPaymentSuccess / previousPaymentFinished) * 100).toFixed(1)) : 0;

    const currentLines = currentPaid.flatMap((order) => order.lines);
    const financial = currentLines.reduce((acc, line) => {
      acc.gold += Number(line.goldValueToman ?? 0n);
      acc.making += Number(line.makingToman ?? 0n);
      acc.profit += Number(line.profitToman ?? 0n);
      acc.tax += Number(line.taxToman ?? 0n);
      acc.stone += Number(line.stoneValueToman ?? 0n);
      return acc;
    }, { gold: 0, making: 0, profit: 0, tax: 0, stone: 0 });

    const productMap = new Map<string, { name: string; sku: string; quantity: number; revenueToman: number }>();
    for (const line of currentLines) {
      const key = line.masterSku;
      const current = productMap.get(key) ?? { name: line.productNameFa, sku: line.masterSku, quantity: 0, revenueToman: 0 };
      current.quantity += 1;
      current.revenueToman += Number(line.unitPriceToman);
      productMap.set(key, current);
    }
    const topProducts = [...productMap.values()].sort((a, b) => b.revenueToman - a.revenueToman).slice(0, 8);

    const pageMap = new Map<string, { views: number; sessions: Set<string> }>();
    for (const event of currentEvents) {
      const current = pageMap.get(event.path) ?? { views: 0, sessions: new Set<string>() };
      current.views += 1;
      current.sessions.add(event.sessionId);
      pageMap.set(event.path, current);
    }
    const topPages = [...pageMap.entries()]
      .map(([path, value]) => ({ path, views: value.views, sessions: value.sessions.size }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 8);

    const sessionSetFor = (predicate: (path: string) => boolean) => new Set(currentEvents.filter((event) => predicate(event.path)).map((event) => event.sessionId)).size;
    const funnel = [
      { key: 'sessions', label: 'بازدیدکننده', count: currentSessions.size },
      { key: 'shop', label: 'فروشگاه', count: sessionSetFor((path) => path === '/shop' || path.startsWith('/collections')) },
      { key: 'product', label: 'صفحه محصول', count: sessionSetFor((path) => path.startsWith('/products/')) },
      { key: 'cart', label: 'سبد خرید', count: sessionSetFor((path) => path === '/cart') },
      { key: 'checkout', label: 'تسویه حساب', count: sessionSetFor((path) => path === '/checkout') },
      { key: 'paid', label: 'سفارش پرداخت‌شده', count: currentPaid.length },
    ];

    const daily = Array.from({ length: days }, (_, index) => {
      const date = addDays(start, index);
      const key = dayKey(date);
      const dayOrders = currentPaid.filter((order) => dayKey(order.createdAt) === key);
      const dayEvents = currentEvents.filter((event) => dayKey(event.createdAt) === key);
      return {
        date: key,
        revenueToman: dayOrders.reduce((sum, order) => sum + Number(order.totalToman), 0),
        orders: dayOrders.length,
        pageViews: dayEvents.length,
        sessions: new Set(dayEvents.map((item) => item.sessionId)).size,
      };
    });

    const statusCounts = (values: typeof currentOrders) => ({
      paid: values.filter((item) => item.status === 'PAID').length,
      pending: values.filter((item) => item.status === 'PENDING_PAYMENT').length,
      cancelled: values.filter((item) => item.status === 'CANCELLED').length,
      refunded: values.filter((item) => item.status === 'REFUNDED').length,
      refundPending: values.filter((item) => item.status === 'REFUND_PENDING').length,
    });

    const fulfillment = ['REGISTERED', 'PREPARING', 'READY_TO_SHIP', 'SHIPPED', 'DELIVERED'].map((status) => ({
      status,
      count: currentPaid.filter((order) => order.fulfillmentStatus === status).length,
    }));

    const inventory = {
      available: units.filter((item) => item.status === 'AVAILABLE').length,
      reserved: units.filter((item) => item.status === 'RESERVED').length,
      sold: units.filter((item) => item.status === 'SOLD').length,
      attention: units.filter((item) => ['QC_PENDING', 'QUALITY_HOLD', 'DAMAGED', 'UNAVAILABLE'].includes(item.status)).length,
      availableValueToman: units.filter((item) => item.status === 'AVAILABLE').reduce((sum, item) => sum + Number(item.currentPriceToman ?? 0n), 0),
    };

    const conversionRate = currentSessions.size ? Number(((currentPaid.length / currentSessions.size) * 100).toFixed(2)) : 0;
    const previousConversionRate = previousSessions.size ? Number(((previousPaid.length / previousSessions.size) * 100).toFixed(2)) : 0;
    const repeatCustomers = customerActivity.filter((customer) => customer.orders.length >= 2).length;
    const newCustomers = customerActivity.filter((customer) => customer.createdAt >= start).length;

    return {
      generatedAt: new Date().toISOString(),
      period: { days, start: start.toISOString(), end: end.toISOString() },
      summary: {
        revenueToman: currentRevenue,
        netRevenueToman: Math.max(0, currentRevenue - currentRefunds),
        orders: currentPaid.length,
        aovToman: currentAov,
        refundsToman: currentRefunds,
        sessions: currentSessions.size,
        pageViews: currentEvents.length,
        conversionRate,
        newCustomers,
        repeatCustomers,
        paymentSuccessRate,
      },
      changes: {
        revenue: changePercent(currentRevenue, previousRevenue),
        netRevenue: changePercent(currentRevenue - currentRefunds, previousRevenue - previousRefunds),
        orders: changePercent(currentPaid.length, previousPaid.length),
        aov: changePercent(currentAov, previousAov),
        sessions: changePercent(currentSessions.size, previousSessions.size),
        pageViews: changePercent(currentEvents.length, previousEvents.length),
        conversion: changePercent(conversionRate, previousConversionRate),
        paymentSuccess: changePercent(paymentSuccessRate, previousPaymentSuccessRate),
      },
      daily,
      financialBreakdown: financial,
      orderStatus: statusCounts(currentOrders),
      fulfillment,
      inventory,
      funnel,
      topProducts,
      topPages,
      siteTrackingSince: currentEvents[0]?.createdAt ?? null,
    };
  }
}
