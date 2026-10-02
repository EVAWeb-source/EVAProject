import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';

const PRODUCT_STATUSES = [
  'DRAFT',
  'ACTIVE',
  'OUT_OF_STOCK',
  'HIDDEN',
  'DISCONTINUED',
  'ARCHIVED',
] as const;

const ADMIN_UNIT_STATUSES = [
  'QC_PENDING',
  'AVAILABLE',
  'QUALITY_HOLD',
  'DAMAGED',
  'UNAVAILABLE',
] as const;

const FULFILLMENT_FLOW = [
  'REGISTERED',
  'PREPARING',
  'READY_TO_SHIP',
  'SHIPPED',
  'DELIVERED',
] as const;

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async dashboard() {
    const [
      collections,
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
      this.prisma.collection.findMany({ orderBy: { createdAt: 'asc' } }),
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
      collections: collections.map((collection) => ({
        id: collection.id,
        nameFa: collection.nameFa,
        slug: collection.slug,
        code: collection.code,
      })),
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
        collectionId: product.collectionId,
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
        productId: unit.productId,
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
          fulfillmentStatus: order.fulfillmentStatus,
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

  async fulfillmentQueue() {
    const orders = await this.prisma.order.findMany({
      where: { status: 'PAID' },
      take: 100,
      include: {
        lines: true,
        payments: { where: { status: 'SUCCEEDED' }, orderBy: { paidAt: 'desc' }, take: 1 },
        invoice: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const counts = Object.fromEntries(FULFILLMENT_FLOW.map((status) => [status, 0])) as Record<string, number>;
    for (const order of orders) counts[order.fulfillmentStatus] = (counts[order.fulfillmentStatus] ?? 0) + 1;

    return {
      generatedAt: new Date().toISOString(),
      summary: counts,
      orders: orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        fulfillmentStatus: order.fulfillmentStatus,
        customerName: order.customerName,
        mobile: order.mobile,
        recipientName: order.recipientName,
        province: order.province,
        city: order.city,
        address: order.address,
        postalCode: order.postalCode,
        shippingCarrier: order.shippingCarrier,
        trackingCode: order.trackingCode,
        shippedAt: order.shippedAt,
        deliveredAt: order.deliveredAt,
        totalToman: Number(order.totalToman),
        createdAt: order.createdAt,
        item: order.lines[0]
          ? {
              productNameFa: order.lines[0].productNameFa,
              unitSku: order.lines[0].unitSku,
              exactWeightGram: order.lines[0].exactWeightGram.toString(),
            }
          : null,
        payment: order.payments[0]
          ? {
              referenceId: order.payments[0].referenceId,
              paidAt: order.payments[0].paidAt,
            }
          : null,
        invoiceNumber: order.invoice?.invoiceNumber ?? null,
      })),
    };
  }

  async updateFulfillment(id: string, input: Record<string, unknown>) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== 'PAID') {
      throw new ConflictException('Only paid orders can enter fulfillment');
    }

    const target = this.requiredString(input.status, 'Fulfillment status').toUpperCase();
    if (!FULFILLMENT_FLOW.includes(target as (typeof FULFILLMENT_FLOW)[number])) {
      throw new BadRequestException('Invalid fulfillment status');
    }

    const currentIndex = FULFILLMENT_FLOW.indexOf(order.fulfillmentStatus as any);
    const targetIndex = FULFILLMENT_FLOW.indexOf(target as any);
    if (targetIndex !== currentIndex + 1) {
      throw new ConflictException('Fulfillment status must move forward one step at a time');
    }

    const data: Record<string, unknown> = {
      fulfillmentStatus: target,
    };

    if (target === 'SHIPPED') {
      const shippingCarrier = this.requiredString(input.shippingCarrier, 'Shipping carrier');
      const trackingCode = this.requiredString(input.trackingCode, 'Tracking code');
      data.shippingCarrier = shippingCarrier;
      data.trackingCode = trackingCode;
      data.shippedAt = new Date();
    }

    if (target === 'DELIVERED') {
      data.deliveredAt = new Date();
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: data as any,
    });

    await this.notifications.fulfillmentChanged({
      id: updated.id,
      orderNumber: updated.orderNumber,
      mobile: updated.mobile,
      fulfillmentStatus: updated.fulfillmentStatus,
      shippingCarrier: updated.shippingCarrier,
      trackingCode: updated.trackingCode,
    });

    return updated;
  }

  async createProduct(input: Record<string, unknown>) {
    const nameFa = this.requiredString(input.nameFa, 'نام محصول');
    const slug = this.requiredString(input.slug, 'slug').toLowerCase();
    const masterSku = this.requiredString(input.masterSku, 'Master SKU').toUpperCase();
    const purity = Number(input.purity ?? 18);
    const status = String(input.status ?? 'DRAFT').toUpperCase();
    const collectionId = input.collectionId ? String(input.collectionId) : null;

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      throw new BadRequestException('Slug must contain only lowercase latin letters, numbers and hyphens');
    }
    if (!/^EVA-[A-Z0-9-]+$/.test(masterSku)) {
      throw new BadRequestException('Master SKU must start with EVA- and use uppercase letters/numbers');
    }
    if (!Number.isInteger(purity) || purity < 1 || purity > 24) {
      throw new BadRequestException('Purity must be an integer between 1 and 24');
    }
    if (!PRODUCT_STATUSES.includes(status as (typeof PRODUCT_STATUSES)[number])) {
      throw new BadRequestException('Invalid product status');
    }

    if (collectionId) {
      const collection = await this.prisma.collection.findUnique({ where: { id: collectionId } });
      if (!collection) throw new NotFoundException('Collection not found');
    }

    try {
      return await this.prisma.masterProduct.create({
        data: {
          nameFa,
          slug,
          masterSku,
          purity,
          status: status as any,
          collectionId,
        },
        include: { collection: true },
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new ConflictException('Slug or Master SKU already exists');
      }
      throw error;
    }
  }

  async updateProduct(id: string, input: Record<string, unknown>) {
    const product = await this.prisma.masterProduct.findUnique({
      where: { id },
      include: { units: { select: { status: true } } },
    });
    if (!product) throw new NotFoundException('Product not found');

    const data: Record<string, unknown> = {};
    if (input.nameFa !== undefined) data.nameFa = this.requiredString(input.nameFa, 'نام محصول');
    if (input.status !== undefined) {
      const status = String(input.status).toUpperCase();
      if (!PRODUCT_STATUSES.includes(status as (typeof PRODUCT_STATUSES)[number])) {
        throw new BadRequestException('Invalid product status');
      }
      data.status = status;
    }
    if (input.collectionId !== undefined) {
      const collectionId = input.collectionId ? String(input.collectionId) : null;
      if (collectionId) {
        const collection = await this.prisma.collection.findUnique({ where: { id: collectionId } });
        if (!collection) throw new NotFoundException('Collection not found');
      }
      data.collectionId = collectionId;
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('No editable fields supplied');
    }

    return this.prisma.masterProduct.update({
      where: { id },
      data: data as any,
      include: { collection: true },
    });
  }

  async createUnit(input: Record<string, unknown>) {
    const productId = this.requiredString(input.productId, 'Product');
    const unitSku = this.requiredString(input.unitSku, 'Unit SKU').toUpperCase();
    const exactWeightGram = Number(input.exactWeightGram);
    const status = String(input.status ?? 'QC_PENDING').toUpperCase();

    const product = await this.prisma.masterProduct.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');
    if (!/^EVA-[A-Z0-9-]+-U[0-9]+$/.test(unitSku)) {
      throw new BadRequestException('Unit SKU must follow the EVA-...-U01 pattern');
    }
    if (!Number.isFinite(exactWeightGram) || exactWeightGram <= 0 || exactWeightGram >= 1000) {
      throw new BadRequestException('Exact weight must be a positive number');
    }
    if (!ADMIN_UNIT_STATUSES.includes(status as (typeof ADMIN_UNIT_STATUSES)[number])) {
      throw new BadRequestException('New Unit cannot start with this status');
    }

    try {
      return await this.prisma.physicalUnit.create({
        data: {
          productId,
          unitSku,
          exactWeightGram: exactWeightGram.toFixed(3),
          status: status as any,
        },
        include: { product: true },
      });
    } catch (error: any) {
      if (error?.code === 'P2002') throw new ConflictException('Unit SKU already exists');
      throw error;
    }
  }

  async updateUnit(id: string, input: Record<string, unknown>) {
    const unit = await this.prisma.physicalUnit.findUnique({ where: { id } });
    if (!unit) throw new NotFoundException('Unit not found');
    if (unit.status === 'SOLD') {
      throw new ConflictException('Sold Unit is immutable');
    }
    if (unit.status === 'RESERVED') {
      throw new ConflictException('Reserved Unit cannot be edited manually');
    }

    const data: Record<string, unknown> = {};
    if (input.status !== undefined) {
      const status = String(input.status).toUpperCase();
      if (!ADMIN_UNIT_STATUSES.includes(status as (typeof ADMIN_UNIT_STATUSES)[number])) {
        throw new BadRequestException('RESERVED/SOLD/RETURNED must be changed by their dedicated workflows');
      }
      data.status = status;
      if (status === 'AVAILABLE') data.reservedUntil = null;
    }
    if (input.exactWeightGram !== undefined) {
      const weight = Number(input.exactWeightGram);
      if (!Number.isFinite(weight) || weight <= 0 || weight >= 1000) {
        throw new BadRequestException('Exact weight must be a positive number');
      }
      data.exactWeightGram = weight.toFixed(3);
      data.currentPriceToman = null;
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('No editable fields supplied');
    }

    return this.prisma.physicalUnit.update({
      where: { id },
      data: data as any,
      include: { product: true },
    });
  }

  private requiredString(value: unknown, label: string) {
    const text = String(value ?? '').trim();
    if (!text) throw new BadRequestException(`${label} is required`);
    return text;
  }
}
