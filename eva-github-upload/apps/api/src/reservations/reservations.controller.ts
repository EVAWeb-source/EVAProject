import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateReservationDto } from './create-reservation.dto.js';
import { ReservationsService } from './reservations.service.js';

@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservations: ReservationsService) {}

  @Post()
  create(@Body() dto: CreateReservationDto) {
    return this.reservations.reserve(dto.unitId);
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
