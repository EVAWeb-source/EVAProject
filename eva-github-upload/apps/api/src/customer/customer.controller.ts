import { Body, Controller, Get, Headers, Param, Post } from '@nestjs/common';
import { CustomerService } from './customer.service.js';

@Controller('customer')
export class CustomerController {
  constructor(private readonly customer: CustomerService) {}

  @Post('auth/request-otp')
  requestOtp(@Body() body: Record<string, unknown>) {
    return this.customer.requestOtp(body);
  }

  @Post('auth/verify-otp')
  verifyOtp(@Body() body: Record<string, unknown>) {
    return this.customer.verifyOtp(body);
  }

  @Post('auth/logout')
  logout(@Headers('authorization') authorization?: string) {
    return this.customer.logout(authorization);
  }

  @Get('me')
  me(@Headers('authorization') authorization?: string) {
    return this.customer.me(authorization);
  }

  @Get('orders')
  orders(@Headers('authorization') authorization?: string) {
    return this.customer.orders(authorization);
  }

  @Get('orders/:orderNumber')
  order(
    @Headers('authorization') authorization: string | undefined,
    @Param('orderNumber') orderNumber: string,
  ) {
    return this.customer.order(authorization, orderNumber);
  }
}
