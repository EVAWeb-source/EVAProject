import { Module } from '@nestjs/common';
import { ReservationsModule } from '../reservations/reservations.module.js';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';

@Module({
  imports: [ReservationsModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
