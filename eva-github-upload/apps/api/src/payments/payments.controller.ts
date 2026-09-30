import { Controller, Get, Param, Post } from '@nestjs/common';
import { PaymentsService } from './payments.service.js';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post('demo/start/:orderNumber')
  startDemo(@Param('orderNumber') orderNumber: string) {
    return this.payments.startDemo(orderNumber);
  }

  @Get('demo/:token')
  getDemo(@Param('token') token: string) {
    return this.payments.getDemo(token);
  }

  @Post('demo/:token/success')
  succeedDemo(@Param('token') token: string) {
    return this.payments.succeedDemo(token);
  }

  @Post('demo/:token/fail')
  failDemo(@Param('token') token: string) {
    return this.payments.failDemo(token);
  }
}
