import { Controller, Get, Param, Query } from '@nestjs/common';
import { InvoicesService } from './invoices.service.js';

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoices: InvoicesService) {}

  @Get(':invoiceNumber')
  getByNumber(
    @Param('invoiceNumber') invoiceNumber: string,
    @Query('accessToken') accessToken = '',
  ) {
    return this.invoices.getByNumber(invoiceNumber, accessToken);
  }

  @Get('order/:orderNumber')
  getByOrder(
    @Param('orderNumber') orderNumber: string,
    @Query('accessToken') accessToken = '',
  ) {
    return this.invoices.getByOrder(orderNumber, accessToken);
  }

  @Get('verify/:verificationCode')
  verify(@Param('verificationCode') verificationCode: string) {
    return this.invoices.verify(verificationCode);
  }
}
