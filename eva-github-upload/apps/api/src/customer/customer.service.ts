import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';

const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_RESEND_MS = 45 * 1000;
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

@Injectable()
export class CustomerService {
  constructor(private readonly prisma: PrismaService) {}

  async requestOtp(input: Record<string, unknown>) {
    const mobile = this.normalizeMobile(input.mobile);
    const demoMode = process.env.OTP_DEMO_MODE === 'true';

    if (!demoMode) {
      throw new ServiceUnavailableException('SMS provider is not configured yet');
    }

    const allowedMobile = this.normalizeConfiguredMobile(process.env.OTP_DEMO_ALLOWED_MOBILE);
    if (!allowedMobile || mobile !== allowedMobile) {
      throw new ForbiddenException('Demo OTP is available only for the configured test mobile');
    }

    const demoCode = String(process.env.OTP_DEMO_CODE ?? '').trim();
    if (!/^\d{6}$/.test(demoCode)) {
      throw new ServiceUnavailableException('OTP demo code is not configured correctly');
    }

    const latest = await this.prisma.otpChallenge.findFirst({
      where: { mobile, consumedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    if (latest) {
      const elapsed = Date.now() - latest.createdAt.getTime();
      if (elapsed < OTP_RESEND_MS && latest.expiresAt.getTime() > Date.now()) {
        throw new HttpException(
          {
            message: 'Please wait before requesting another code',
            retryAfterSeconds: Math.ceil((OTP_RESEND_MS - elapsed) / 1000),
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    await this.prisma.otpChallenge.create({
      data: {
        mobile,
        codeHash: this.otpHash(mobile, demoCode),
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
    });

    return {
      ok: true,
      mobileMasked: this.maskMobile(mobile),
      expiresInSeconds: Math.floor(OTP_TTL_MS / 1000),
      resendAfterSeconds: Math.floor(OTP_RESEND_MS / 1000),
      mode: 'DEMO_SMS_PENDING',
    };
  }

  async verifyOtp(input: Record<string, unknown>) {
    const mobile = this.normalizeMobile(input.mobile);
    const code = this.latinDigits(String(input.code ?? '')).trim();

    if (!/^\d{6}$/.test(code)) {
      throw new BadRequestException('OTP must be exactly 6 digits');
    }

    const challenge = await this.prisma.otpChallenge.findFirst({
      where: { mobile, consumedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    if (!challenge || challenge.expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException('OTP is invalid or expired');
    }

    if (challenge.attempts >= MAX_OTP_ATTEMPTS) {
      throw new HttpException('Too many OTP attempts', HttpStatus.TOO_MANY_REQUESTS);
    }

    const provided = Buffer.from(this.otpHash(mobile, code), 'hex');
    const expected = Buffer.from(challenge.codeHash, 'hex');
    const matches = provided.length === expected.length && timingSafeEqual(provided, expected);

    if (!matches) {
      await this.prisma.otpChallenge.update({
        where: { id: challenge.id },
        data: { attempts: { increment: 1 } },
      });
      throw new UnauthorizedException('OTP is incorrect');
    }

    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

    await this.prisma.$transaction([
      this.prisma.otpChallenge.update({
        where: { id: challenge.id },
        data: { consumedAt: new Date() },
      }),
      this.prisma.customerSession.create({
        data: {
          tokenHash: this.sessionHash(token),
          mobile,
          expiresAt,
        },
      }),
    ]);

    return {
      ok: true,
      token,
      mobile,
      expiresAt,
    };
  }

  async logout(authorization?: string) {
    const token = this.bearerToken(authorization);
    await this.prisma.customerSession.updateMany({
      where: { tokenHash: this.sessionHash(token), revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { ok: true };
  }

  async me(authorization?: string) {
    const session = await this.requireSession(authorization);
    return { mobile: session.mobile, expiresAt: session.expiresAt };
  }

  async orders(authorization?: string) {
    const session = await this.requireSession(authorization);
    const orders = await this.prisma.order.findMany({
      where: { mobile: session.mobile },
      include: {
        lines: true,
        payments: { orderBy: { createdAt: 'desc' }, take: 1 },
        invoice: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      mobile: session.mobile,
      orders: orders.map((order) => this.toCustomerOrder(order)),
    };
  }

  async order(authorization: string | undefined, orderNumber: string) {
    const session = await this.requireSession(authorization);
    const order = await this.prisma.order.findFirst({
      where: { orderNumber, mobile: session.mobile },
      include: {
        lines: true,
        payments: { orderBy: { createdAt: 'desc' }, take: 1 },
        invoice: true,
      },
    });

    if (!order) throw new NotFoundException('Order not found');
    return this.toCustomerOrder(order);
  }

  private async requireSession(authorization?: string) {
    const token = this.bearerToken(authorization);
    const tokenHash = this.sessionHash(token);

    const session = await this.prisma.customerSession.findUnique({ where: { tokenHash } });
    if (
      !session ||
      session.revokedAt ||
      session.expiresAt.getTime() <= Date.now()
    ) {
      throw new UnauthorizedException('Customer session is invalid or expired');
    }

    await this.prisma.customerSession.update({
      where: { id: session.id },
      data: { lastUsedAt: new Date() },
    });

    return session;
  }

  private toCustomerOrder(order: any) {
    const payment = order.payments?.[0] ?? null;
    const items = (order.lines ?? []).map((line: any) => ({
      name: line.productNameFa,
      masterSku: line.masterSku,
      unitSku: line.unitSku,
      weightGram: String(line.exactWeightGram),
      purity: line.purity,
      priceToman: Number(line.unitPriceToman),
    }));

    return {
      number: order.orderNumber,
      status: order.status,
      fulfillmentStatus: order.fulfillmentStatus,
      customerName: order.customerName,
      mobile: order.mobile,
      recipientName: order.recipientName,
      province: order.province,
      city: order.city,
      address: order.address,
      postalCode: order.postalCode,
      isGift: order.isGift,
      giftMessage: order.giftMessage,
      hidePriceInPackage: order.hidePriceInPackage,
      shippingCarrier: order.shippingCarrier,
      trackingCode: order.trackingCode,
      shippedAt: order.shippedAt,
      deliveredAt: order.deliveredAt,
      totalToman: Number(order.totalToman),
      createdAt: order.createdAt,
      invoice: order.invoice
        ? {
            invoiceNumber: order.invoice.invoiceNumber,
            verificationCode: order.invoice.verificationCode,
          }
        : null,
      payment: payment
        ? {
            status: payment.status,
            provider: payment.provider,
            referenceId: payment.referenceId,
            paidAt: payment.paidAt,
          }
        : null,
      items,
      item: items[0] ?? null,
    };
  }

  private bearerToken(authorization?: string) {
    const value = String(authorization ?? '');
    if (!value.startsWith('Bearer ')) {
      throw new UnauthorizedException('Customer session is required');
    }
    const token = value.slice(7).trim();
    if (!token) throw new UnauthorizedException('Customer session is required');
    return token;
  }

  private normalizeMobile(value: unknown) {
    let mobile = this.latinDigits(String(value ?? '')).replace(/\D/g, '');
    if (mobile.startsWith('0098')) mobile = '0' + mobile.slice(4);
    else if (mobile.startsWith('98')) mobile = '0' + mobile.slice(2);
    if (!/^09\d{9}$/.test(mobile)) {
      throw new BadRequestException('Enter a valid Iranian mobile number');
    }
    return mobile;
  }

  private latinDigits(value: string) {
    return value
      .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
      .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)));
  }

  private normalizeConfiguredMobile(value?: string) {
    if (!value) return null;
    try {
      return this.normalizeMobile(value);
    } catch {
      return null;
    }
  }

  private otpHash(mobile: string, code: string) {
    return createHash('sha256')
      .update(`${this.secret()}:otp:${mobile}:${code}`)
      .digest('hex');
  }

  private sessionHash(token: string) {
    return createHash('sha256')
      .update(`${this.secret()}:session:${token}`)
      .digest('hex');
  }

  private secret() {
    const dedicated = String(process.env.OTP_SECRET ?? '').trim();
    if (dedicated) return dedicated;

    if (process.env.OTP_DEMO_MODE === 'true') {
      const demoFallback = String(process.env.ADMIN_API_KEY ?? '').trim();
      if (demoFallback) return demoFallback;
    }

    throw new ServiceUnavailableException('OTP secret is not configured');
  }

  private maskMobile(mobile: string) {
    return `${mobile.slice(0, 4)}***${mobile.slice(-4)}`;
  }
}
