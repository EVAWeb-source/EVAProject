import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class TrackingService {
  constructor(private readonly prisma: PrismaService) {}

  async track(input: Record<string, unknown>) {
    const orderNumber = String(input.orderNumber ?? '').trim().toUpperCase();
    const mobile = this.normalizeMobile(input.mobile);

    if (!/^EVA-\d{4}-\d{6}$/.test(orderNumber)) {
      throw new BadRequestException('شماره سفارش معتبر نیست');
    }

    const order = await this.prisma.order.findFirst({
      where: { orderNumber, mobile },
      include: {
        lines: true,
        payments: { where: { status: 'SUCCEEDED' }, orderBy: { paidAt: 'desc' }, take: 1 },
      },
    });

    if (!order) {
      // Deliberately generic so callers cannot learn whether the order number
      // or mobile exists independently.
      throw new NotFoundException('اطلاعات سفارش با این مشخصات پیدا نشد');
    }

    const item = order.lines[0] ?? null;
    const payment = order.payments[0] ?? null;

    return {
      number: order.orderNumber,
      status: order.status,
      fulfillmentStatus: order.fulfillmentStatus,
      createdAt: order.createdAt,
      paidAt: payment?.paidAt ?? null,
      item: item
        ? {
            name: item.productNameFa,
            weightGram: String(item.exactWeightGram),
            purity: item.purity,
          }
        : null,
      shipping: {
        carrier: order.shippingCarrier,
        trackingCode: order.trackingCode,
        shippedAt: order.shippedAt,
        deliveredAt: order.deliveredAt,
      },
    };
  }

  private normalizeMobile(value: unknown) {
    let mobile = this.latinDigits(String(value ?? '')).replace(/\D/g, '');
    if (mobile.startsWith('0098')) mobile = '0' + mobile.slice(4);
    else if (mobile.startsWith('98')) mobile = '0' + mobile.slice(2);
    if (!/^09\d{9}$/.test(mobile)) {
      throw new BadRequestException('شماره موبایل معتبر نیست');
    }
    return mobile;
  }

  private latinDigits(value: string) {
    return value
      .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
      .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)));
  }
}
