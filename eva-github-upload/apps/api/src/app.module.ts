import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './health/health.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { PricingModule } from './pricing/pricing.module.js';
import { CatalogModule } from './catalog/catalog.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { ReservationsModule } from './reservations/reservations.module.js';
import { PaymentsModule } from './payments/payments.module.js';
import { InvoicesModule } from './invoices/invoices.module.js';
import { AdminModule } from './admin/admin.module.js';
import { CustomerModule } from './customer/customer.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    HealthModule,
    PricingModule,
    ReservationsModule,
    CatalogModule,
    OrdersModule,
    PaymentsModule,
    InvoicesModule,
    AdminModule,
    CustomerModule,
  ],
})
export class AppModule {}
