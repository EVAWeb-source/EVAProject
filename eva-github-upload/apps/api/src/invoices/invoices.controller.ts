import { Controller, Get, Param } from '@nestjs/common';
import { InvoicesService } from './invoices.service.js';

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoices: InvoicesService) {}

  @Get(':invoiceNumber')
  getByNumber(@Param('invoiceNumber') invoiceNumber: string) {
    return this.invoices.getByNumber(invoiceNumber);
  }

  @Get('order/:orderNumber')
  getByOrder(@Param('orderNumber') orderNumber: string) {
    return this.invoices.getByOrder(orderNumber);
  }

  @Get('verify/:verificationCode')
  verify(@Param('verificationCode') verificationCode: string) {
    return this.invoices.verify(verificationCode);
  }
}
