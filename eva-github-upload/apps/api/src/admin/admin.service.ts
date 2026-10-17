import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';

const PRODUCT_CATEGORY_CODES = ['NEC', 'PEN', 'BRA', 'RIN', 'EAR', 'SET', 'ANK', 'CHM'] as const;

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
      this.prisma.masterProduct.count({ where: { status: { in: ['ACTIVE', 'OUT_OF_STOCK'] } } }),
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
      products: products.map((product) => {
        const availableCount = product.units.filter((unit) => unit.status === 'AVAILABLE').length;
        return {
          id: product.id,
          nameFa: product.nameFa,
          slug: product.slug,
          masterSku: product.masterSku,
          categoryCode: this.categoryCodeFromSku(product.masterSku),
          purity: product.purity,
          status: this.effectiveProductStatus(product.status, availableCount),
          collectionId: product.collectionId,
          collection: product.collection?.nameFa ?? null,
          unitCount: product.units.length,
          availableCount,
          units: product.units.map((unit) => ({
            id: unit.id,
            unitSku: unit.unitSku,
            exactWeightGram: unit.exactWeightGram.toString(),
            currentPriceToman: unit.currentPriceToman === null ? null : Number(unit.currentPriceToman),
            status: unit.status,
            reservedUntil: unit.reservedUntil,
          })),
        };
      }),
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
        const items = order.lines.map((line) => ({
          productNameFa: line.productNameFa,
          unitSku: line.unitSku,
          exactWeightGram: line.exactWeightGram.toString(),
          unitPriceToman: Number(line.unitPriceToman),
        }));
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
          itemCount: items.length,
          items,
          item: items[0] ?? null,
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
      invoices: invoices.map((invoice) => {
        const items = invoice.lines.map((line) => ({
          productNameFa: line.productNameFa,
          unitSku: line.unitSku,
          exactWeightGram: line.exactWeightGram.toString(),
          unitPriceToman: Number(line.finalPriceToman),
        }));
        return {
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          orderId: invoice.orderId,
          status: invoice.status,
          customerName: invoice.customerName,
          customerMobile: invoice.customerMobile,
          totalToman: Number(invoice.totalToman),
          verificationCode: invoice.verificationCode,
          issuedAt: invoice.issuedAt,
          itemCount: items.length,
          items,
          item: items[0] ?? null,
        };
      }),
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
      orders: orders.map((order) => {
        const items = order.lines.map((line) => ({
          productNameFa: line.productNameFa,
          unitSku: line.unitSku,
          exactWeightGram: line.exactWeightGram.toString(),
          unitPriceToman: Number(line.unitPriceToman),
        }));
        return {
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
          itemCount: items.length,
          items,
          item: items[0] ?? null,
          payment: order.payments[0]
            ? {
                referenceId: order.payments[0].referenceId,
                paidAt: order.payments[0].paidAt,
              }
            : null,
          invoiceNumber: order.invoice?.invoiceNumber ?? null,
        };
      }),
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

    const data: Record<string, unknown> = { fulfillmentStatus: target };

    if (target === 'SHIPPED') {
      const shippingCarrier = this.requiredString(input.shippingCarrier, 'Shipping carrier');
      const trackingCode = this.requiredString(input.trackingCode, 'Tracking code');
      data.shippingCarrier = shippingCarrier;
      data.trackingCode = trackingCode;
      data.shippedAt = new Date();
    }
    if (target === 'DELIVERED') data.deliveredAt = new Date();

    const updated = await this.prisma.order.update({ where: { id }, data: data as any });

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

  async smsOutbox() {
    const [items, pending, sent, failed] = await Promise.all([
      this.prisma.smsNotification.findMany({ take: 100, orderBy: { createdAt: 'desc' } }),
      this.prisma.smsNotification.count({ where: { status: 'PENDING_PROVIDER' } }),
      this.prisma.smsNotification.count({ where: { status: 'SENT' } }),
      this.prisma.smsNotification.count({ where: { status: 'FAILED' } }),
    ]);

    return {
      generatedAt: new Date().toISOString(),
      summary: { pending, sent, failed, total: items.length },
      items: items.map((item) => ({
        id: item.id,
        orderNumber: item.orderNumber,
        mobile: item.mobile,
        event: item.event,
        body: item.body,
        provider: item.provider,
        status: item.status,
        providerRef: item.providerRef,
        error: item.error,
        createdAt: item.createdAt,
        sentAt: item.sentAt,
      })),
    };
  }

  async createTestSms(input: Record<string, unknown>) {
    const mobile = this.normalizeMobile(input.mobile);
    const orderNumber = String(input.orderNumber ?? '').trim().toUpperCase() || null;

    if (orderNumber) {
      const order = await this.prisma.order.findUnique({ where: { orderNumber } });
      if (!order) throw new NotFoundException('Order not found');
      if (order.mobile !== mobile) throw new ConflictException('Mobile does not match this order');
    }

    return this.prisma.smsNotification.create({
      data: {
        orderNumber,
        mobile,
        event: 'ADMIN_TEST',
        body: orderNumber
          ? `ایوا: این یک پیام آزمایشی برای سفارش ${orderNumber} است.`
          : 'ایوا: این یک پیام آزمایشی سیستم پیامک است.',
        provider: process.env.SMS_PROVIDER ?? 'NOT_CONFIGURED',
        status: 'PENDING_PROVIDER',
      },
    });
  }

  async createProduct(input: Record<string, unknown>) {
    const nameFa = this.requiredString(input.nameFa, 'نام محصول');
    const slug = this.requiredString(input.slug, 'slug').toLowerCase();
    const masterSku = this.requiredString(input.masterSku, 'Master SKU').toUpperCase();
    const categoryCode = this.validateCategoryCode(input.categoryCode);
    const purity = Number(input.purity ?? 18);
    const collectionId = input.collectionId ? String(input.collectionId) : null;

    this.validateSlug(slug);
    this.validateMasterSku(masterSku);
    this.validateMasterSkuCategory(masterSku, categoryCode);
    this.validatePurity(purity);

    if (collectionId) {
      const collection = await this.prisma.collection.findUnique({ where: { id: collectionId } });
      if (!collection) throw new NotFoundException('Collection not found');
    }

    try {
      return await this.prisma.masterProduct.create({
        data: { nameFa, slug, masterSku, purity, status: 'DRAFT', collectionId },
        include: { collection: true },
      });
    } catch (error: any) {
      if (error?.code === 'P2002') throw new ConflictException('Slug or Master SKU already exists');
      throw error;
    }
  }

  async updateProduct(id: string, input: Record<string, unknown>) {
    const product = await this.prisma.masterProduct.findUnique({
      where: { id },
      include: { units: { select: { id: true, status: true } } },
    });
    if (!product) throw new NotFoundException('Product not found');

    if (input.status !== undefined) {
      throw new BadRequestException('Product status is managed automatically by publish, inventory and archive controls');
    }

    const data: Record<string, unknown> = {};
    const suppliedCategoryCode = input.categoryCode !== undefined ? this.validateCategoryCode(input.categoryCode) : null;

    if (input.nameFa !== undefined) data.nameFa = this.requiredString(input.nameFa, 'نام محصول');
    if (input.slug !== undefined) {
      const slug = this.requiredString(input.slug, 'slug').toLowerCase();
      this.validateSlug(slug);
      data.slug = slug;
    }
    if (input.masterSku !== undefined) {
      const masterSku = this.requiredString(input.masterSku, 'Master SKU').toUpperCase();
      this.validateMasterSku(masterSku);
      if (suppliedCategoryCode) this.validateMasterSkuCategory(masterSku, suppliedCategoryCode);
      if (masterSku !== product.masterSku && product.units.length > 0) {
        throw new ConflictException('Master SKU cannot change after Units have been created');
      }
      data.masterSku = masterSku;
    } else if (suppliedCategoryCode) {
      this.validateMasterSkuCategory(product.masterSku, suppliedCategoryCode);
    }
    if (input.purity !== undefined) {
      const purity = Number(input.purity);
      this.validatePurity(purity);
      if (purity !== product.purity && product.units.length > 0) {
        throw new ConflictException('Purity cannot change after Units have been created');
      }
      data.purity = purity;
    }
    if (input.collectionId !== undefined) {
      const collectionId = input.collectionId ? String(input.collectionId) : null;
      if (collectionId) {
        const collection = await this.prisma.collection.findUnique({ where: { id: collectionId } });
        if (!collection) throw new NotFoundException('Collection not found');
      }
      data.collectionId = collectionId;
    }

    if (Object.keys(data).length === 0) throw new BadRequestException('No editable fields supplied');

    try {
      return await this.prisma.masterProduct.update({
        where: { id },
        data: data as any,
        include: { collection: true },
      });
    } catch (error: any) {
      if (error?.code === 'P2002') throw new ConflictException('Slug or Master SKU already exists');
      throw error;
    }
  }

  async deleteProduct(id: string) {
    const product = await this.prisma.masterProduct.findUnique({
      where: { id },
      include: {
        units: {
          include: {
            _count: { select: { orderLines: true, reservations: true, afterSalesCases: true } },
          },
        },
      },
    });
    if (!product) throw new NotFoundException('Product not found');

    const protectedUnit = product.units.find((unit) =>
      ['RESERVED', 'SOLD', 'RETURNED'].includes(unit.status) ||
      unit._count.orderLines > 0 ||
      unit._count.reservations > 0 ||
      unit._count.afterSalesCases > 0,
    );
    if (protectedUnit) {
      throw new ConflictException('Product has inventory history and cannot be permanently deleted. Archive it instead.');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.physicalUnit.deleteMany({ where: { productId: product.id } });
      await tx.masterProduct.delete({ where: { id: product.id } });
    });

    return { ok: true, id: product.id, nameFa: product.nameFa, masterSku: product.masterSku };
  }

  async createUnit(input: Record<string, unknown>) {
    const productId = this.requiredString(input.productId, 'Product');
    const unitSku = this.requiredString(input.unitSku, 'Unit SKU').toUpperCase();
    const exactWeightGram = Number(input.exactWeightGram);
    const status = String(input.status ?? 'QC_PENDING').toUpperCase();

    const product = await this.prisma.masterProduct.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');

    const expectedUnitPattern = new RegExp(`^${product.masterSku}-U\\d{2,}$`);
    if (!expectedUnitPattern.test(unitSku)) {
      throw new BadRequestException(`Unit SKU must match ${product.masterSku}-U01 and cannot use another product/category code`);
    }
    if (!Number.isFinite(exactWeightGram) || exactWeightGram <= 0 || exactWeightGram >= 1000) {
      throw new BadRequestException('Exact weight must be a positive number');
    }
    if (!ADMIN_UNIT_STATUSES.includes(status as (typeof ADMIN_UNIT_STATUSES)[number])) {
      throw new BadRequestException('New Unit cannot start with this status');
    }

    try {
      const created = await this.prisma.physicalUnit.create({
        data: {
          productId,
          unitSku,
          exactWeightGram: exactWeightGram.toFixed(3),
          status: status as any,
        },
        include: { product: true },
      });
      await this.syncProductStockStatus(productId);
      return created;
    } catch (error: any) {
      if (error?.code === 'P2002') throw new ConflictException('Unit SKU already exists');
      throw error;
    }
  }

  async updateUnit(id: string, input: Record<string, unknown>) {
    const unit = await this.prisma.physicalUnit.findUnique({ where: { id } });
    if (!unit) throw new NotFoundException('Unit not found');
    if (unit.status === 'SOLD') throw new ConflictException('Sold Unit is immutable');
    if (unit.status === 'RESERVED') throw new ConflictException('Reserved Unit cannot be edited manually');
    if (unit.status === 'RETURNED') {
      throw new ConflictException('Returned Unit must be changed by the after-sales QC workflow');
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

    if (Object.keys(data).length === 0) throw new BadRequestException('No editable fields supplied');

    const updated = await this.prisma.physicalUnit.update({
      where: { id },
      data: data as any,
      include: { product: true },
    });
    await this.syncProductStockStatus(unit.productId);
    return updated;
  }

  async deleteUnit(id: string) {
    const unit = await this.prisma.physicalUnit.findUnique({
      where: { id },
      include: {
        product: { select: { id: true, status: true } },
        _count: { select: { orderLines: true, reservations: true, afterSalesCases: true } },
      },
    });
    if (!unit) throw new NotFoundException('Unit not found');
    if (['RESERVED', 'SOLD', 'RETURNED'].includes(unit.status)) {
      throw new ConflictException('Reserved, sold or returned Unit cannot be deleted');
    }
    if (unit._count.orderLines > 0 || unit._count.reservations > 0 || unit._count.afterSalesCases > 0) {
      throw new ConflictException('Unit has order/reservation history and cannot be permanently deleted');
    }

    await this.prisma.physicalUnit.delete({ where: { id: unit.id } });
    await this.syncProductStockStatus(unit.product.id);

    return { ok: true, id: unit.id, unitSku: unit.unitSku };
  }

  private async syncProductStockStatus(productId: string) {
    const product = await this.prisma.masterProduct.findUnique({
      where: { id: productId },
      select: { status: true },
    });
    if (!product || !['ACTIVE', 'OUT_OF_STOCK'].includes(product.status)) return;

    const availableCount = await this.prisma.physicalUnit.count({
      where: { productId, status: 'AVAILABLE' },
    });
    const nextStatus = availableCount > 0 ? 'ACTIVE' : 'OUT_OF_STOCK';
    if (product.status === nextStatus) return;

    await this.prisma.masterProduct.update({
      where: { id: productId },
      data: { status: nextStatus as any },
    });
  }

  private effectiveProductStatus(status: string, availableCount: number) {
    if (!['ACTIVE', 'OUT_OF_STOCK'].includes(status)) return status;
    return availableCount > 0 ? 'ACTIVE' : 'OUT_OF_STOCK';
  }

  private validateSlug(slug: string) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      throw new BadRequestException('Slug must contain only lowercase latin letters, numbers and hyphens');
    }
  }

  private validateMasterSku(masterSku: string) {
    if (!/^EVA-[A-Z0-9-]+$/.test(masterSku)) {
      throw new BadRequestException('Master SKU must start with EVA- and use uppercase letters/numbers');
    }
    const categoryCode = this.categoryCodeFromSku(masterSku);
    if (!PRODUCT_CATEGORY_CODES.includes(categoryCode as (typeof PRODUCT_CATEGORY_CODES)[number])) {
      throw new BadRequestException(`Master SKU category code must be one of: ${PRODUCT_CATEGORY_CODES.join(', ')}`);
    }
  }

  private categoryCodeFromSku(masterSku: string) {
    return String(masterSku ?? '').trim().toUpperCase().split('-')[2] ?? '';
  }

  private validateCategoryCode(value: unknown) {
    const categoryCode = this.requiredString(value, 'دسته‌بندی').toUpperCase();
    if (!PRODUCT_CATEGORY_CODES.includes(categoryCode as (typeof PRODUCT_CATEGORY_CODES)[number])) {
      throw new BadRequestException('Invalid product category');
    }
    return categoryCode;
  }

  private validateMasterSkuCategory(masterSku: string, categoryCode: string) {
    const skuCategory = this.categoryCodeFromSku(masterSku);
    if (skuCategory !== categoryCode) {
      throw new BadRequestException(`Master SKU category code (${skuCategory || 'missing'}) does not match selected category (${categoryCode})`);
    }
  }

  private validatePurity(purity: number) {
    if (!Number.isInteger(purity) || purity < 1 || purity > 24) {
      throw new BadRequestException('Purity must be an integer between 1 and 24');
    }
  }

  private normalizeMobile(value: unknown) {
    let mobile = String(value ?? '').replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit))).replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit))).replace(/\D/g, '');
    if (mobile.startsWith('0098')) mobile = '0' + mobile.slice(4);
    else if (mobile.startsWith('98')) mobile = '0' + mobile.slice(2);
    if (!/^09\d{9}$/.test(mobile)) throw new BadRequestException('Invalid Iranian mobile number');
    return mobile;
  }

  private requiredString(value: unknown, label: string) {
    const text = String(value ?? '').trim();
    if (!text) throw new BadRequestException(`${label} is required`);
    return text;
  }
}
