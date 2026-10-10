import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateReservationDto } from './create-reservation.dto.js';
import { CreateReservationsDto } from './create-reservations.dto.js';
import { ReservationsService } from './reservations.service.js';

@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservations: ReservationsService) {}

  @Post()
  create(@Body() dto: CreateReservationDto) {
    return this.reservations.reserve(dto.unitId);
  }

  @Post('batch')
  createBatch(@Body() dto: CreateReservationsDto) {
    return this.reservations.reserveMany(dto.unitIds);
  }

  @Get(':token')
  get(@Param('token') token: string) {
    return this.reservations.getByToken(token);
  }

  @Post(':token/release')
  release(@Param('token') token: string) {
    return this.reservations.release(token);
  }
}
