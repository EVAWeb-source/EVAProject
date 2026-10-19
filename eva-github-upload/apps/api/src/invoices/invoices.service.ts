import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class InvoicesService {
  constructor(private readonly prisma: PrismaService) {}

  async getByNumber(invoiceNumber: string, accessToken: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { invoiceNumber },
      include: { order: true, lines: true },
    });

    if (!invoice) throw new NotFoundException('Invoice not found');
    await this.assertPrivateAccess(invoice.order.orderNumber, accessToken);
    return this.toDetailed(invoice);
  }

  async getByOrder(orderNumber: string, accessToken: string) {
    await this.assertPrivateAccess(orderNumber, accessToken);

    const existing = await this.prisma.invoice.findFirst({
      where: { order: { orderNumber } },
      include: { order: true, lines: true },
    });

    if (existing) return this.toDetailed(existing);
    return this.ensureForPaidOrder(orderNumber);
  }

  async verify(verificationCode: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { verificationCode },
      include: { order: true, lines: true },
    });

    if (!invoice) throw new NotFoundException('Invoice not found');

    return {
      valid: invoice.status === 'ISSUED',
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      sellerName: invoice.sellerName,
      issuedAt: invoice.issuedAt,
      orderNumber: invoice.order.orderNumber,
      totalToman: Number(invoice.totalToman),
      items: invoice.lines.map((line) => ({
        productNameFa: line.productNameFa,
        unitSku: line.unitSku,
        exactWeightGram: line.exactWeightGram.toString(),
        purity: line.purity,
        stoneName: line.stoneName,
        stoneCarat: line.stoneCarat === null ? null : Number(line.stoneCarat),
        stoneWeightGram: line.stoneWeightGram === null ? null : Number(line.stoneWeightGram),
        stoneValueToman: line.stoneValueToman === null ? null : Number(line.stoneValueToman),
        finalPriceToman: Number(line.finalPriceToman),
      })),
    };
  }

  private async assertPrivateAccess(orderNumber: string, accessToken: string) {
    const token = accessToken.trim();
    if (!token) throw new NotFoundException('Invoice not found');

    const payment = await this.prisma.paymentAttempt.findUnique({
      where: { token },
      select: {
        status: true,
        order: { select: { orderNumber: true } },
      },
    });

    if (
      !payment ||
      !['SUCCEEDED', 'REFUNDED'].includes(payment.status) ||
      payment.order.orderNumber !== orderNumber
    ) {
      throw new NotFoundException('Invoice not found');
    }
  }

  async ensureForPaidOrder(orderNumber: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: {
        invoice: { include: { order: true, lines: true } },
        lines: true,
        payments: { where: { status: 'SUCCEEDED' }, orderBy: { paidAt: 'desc' } },
      },
    });

    if (!order) throw new NotFoundException('Order not found');
    if (order.invoice) return this.toDetailed(order.invoice);
    if (order.status !== 'PAID') throw new ConflictException('Invoice is only issued for paid orders');

    const payment = order.payments[0];
    const line = order.lines[0];
    if (!payment || !payment.referenceId) throw new ConflictException('Successful payment is missing');
    if (!line) throw new ConflictException('Order line is missing');

    const invoiceNumber = order.orderNumber.replace(/^EVA-/, 'EVA-INV-');

    const invoice = await this.prisma.invoice.create({
      data: {
        invoiceNumber,
        verificationCode: randomUUID(),
        orderId: order.id,
        customerName: order.customerName,
        customerMobile: order.mobile,
        recipientName: order.recipientName,
        province: order.province,
        city: order.city,
        address: order.address,
        postalCode: order.postalCode,
        paymentProvider: payment.provider,
        paymentReference: payment.referenceId,
        totalToman: order.totalToman,
        lines: {
          create: order.lines.map((item) => ({
            productNameFa: item.productNameFa,
            masterSku: item.masterSku,
            unitSku: item.unitSku,
            exactWeightGram: item.exactWeightGram,
            purity: item.purity,
            goldRateTomanPerGram: item.goldRateTomanPerGram,
            goldValueToman: item.goldValueToman,
            makingToman: item.makingToman,
            profitToman: item.profitToman,
            taxToman: item.taxToman,
            goldFinalToman: item.goldFinalToman,
            stoneName: item.stoneName,
            stoneCarat: item.stoneCarat,
            stoneWeightGram: item.stoneWeightGram,
            stonePriceTomanPerGram: item.stonePriceTomanPerGram,
            stoneValueToman: item.stoneValueToman,
            finalPriceToman: item.unitPriceToman,
            rateVersion: item.rateVersion,
            pricingFormulaVersion: item.pricingFormulaVersion,
            pricingRuleId: item.pricingRuleId,
          })),
        },
      },
      include: { order: true, lines: true },
    });

    return this.toDetailed(invoice);
  }

  private toDetailed(invoice: any) {
    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      verificationCode: invoice.verificationCode,
      status: invoice.status,
      sellerName: invoice.sellerName,
      issuedAt: invoice.issuedAt,
      orderNumber: invoice.order.orderNumber,
      customer: {
        name: invoice.customerName,
        mobile: invoice.customerMobile,
        recipientName: invoice.recipientName,
        province: invoice.province,
        city: invoice.city,
        address: invoice.address,
        postalCode: invoice.postalCode,
      },
      payment: {
        provider: invoice.paymentProvider,
        reference: invoice.paymentReference,
      },
      totalToman: Number(invoice.totalToman),
      verificationPath: `/verify/${invoice.verificationCode}`,
      items: invoice.lines.map((line: any) => ({
        productNameFa: line.productNameFa,
        masterSku: line.masterSku,
        unitSku: line.unitSku,
        exactWeightGram: line.exactWeightGram.toString(),
        purity: line.purity,
        goldRateTomanPerGram: line.goldRateTomanPerGram === null ? null : Number(line.goldRateTomanPerGram),
        goldValueToman: line.goldValueToman === null ? null : Number(line.goldValueToman),
        makingToman: line.makingToman === null ? null : Number(line.makingToman),
        profitToman: line.profitToman === null ? null : Number(line.profitToman),
        taxToman: line.taxToman === null ? null : Number(line.taxToman),
        goldFinalToman: line.goldFinalToman === null ? null : Number(line.goldFinalToman),
        stoneName: line.stoneName,
        stoneCarat: line.stoneCarat === null ? null : Number(line.stoneCarat),
        stoneWeightGram: line.stoneWeightGram === null ? null : Number(line.stoneWeightGram),
        stonePriceTomanPerGram: line.stonePriceTomanPerGram === null ? null : Number(line.stonePriceTomanPerGram),
        stoneValueToman: line.stoneValueToman === null ? null : Number(line.stoneValueToman),
        finalPriceToman: Number(line.finalPriceToman),
        rateVersion: line.rateVersion,
        pricingFormulaVersion: line.pricingFormulaVersion,
      })),
    };
  }
}
