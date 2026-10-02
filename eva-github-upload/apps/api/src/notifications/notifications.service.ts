import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

const STATUS_TEXT: Record<string, string> = {
  REGISTERED: 'ثبت شد',
  PREPARING: 'در حال آماده‌سازی است',
  READY_TO_SHIP: 'آماده ارسال است',
  SHIPPED: 'ارسال شد',
  DELIVERED: 'تحویل شد',
};

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async orderPaid(order: { id: string; orderNumber: string; mobile: string }) {
    return this.enqueue({
      orderId: order.id,
      orderNumber: order.orderNumber,
      mobile: order.mobile,
      event: 'ORDER_PAID',
      body: `ایوا: پرداخت سفارش ${order.orderNumber} تایید شد. سفارش شما ثبت شد.`,
    });
  }

  async fulfillmentChanged(order: {
    id: string;
    orderNumber: string;
    mobile: string;
    fulfillmentStatus: string;
    shippingCarrier?: string | null;
    trackingCode?: string | null;
  }) {
    const statusText = STATUS_TEXT[order.fulfillmentStatus] ?? order.fulfillmentStatus;
    let body = `ایوا: وضعیت سفارش ${order.orderNumber}: ${statusText}.`;
    if (order.fulfillmentStatus === 'SHIPPED' && order.trackingCode) {
      body += ` کد رهگیری: ${order.trackingCode}`;
      if (order.shippingCarrier) body += ` - ${order.shippingCarrier}`;
    }

    return this.enqueue({
      orderId: order.id,
      orderNumber: order.orderNumber,
      mobile: order.mobile,
      event: `FULFILLMENT_${order.fulfillmentStatus}`,
      body,
    });
  }

  private async enqueue(input: {
    orderId?: string;
    orderNumber?: string;
    mobile: string;
    event: string;
    body: string;
  }) {
    try {
      return await this.prisma.smsNotification.create({
        data: {
          ...input,
          provider: process.env.SMS_PROVIDER ?? 'NOT_CONFIGURED',
          status: 'PENDING_PROVIDER',
        },
      });
    } catch (error) {
      // Notifications must never break payment or fulfillment.
      console.error('SMS outbox enqueue failed', error);
      return null;
    }
  }
}
