import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getHealth() {
    try {
      await this.prisma.$queryRawUnsafe('SELECT 1');
      return {
        service: 'eva-api',
        status: 'ok',
        database: 'ok',
        timestamp: new Date().toISOString(),
      };
    } catch {
      throw new ServiceUnavailableException({
        service: 'eva-api',
        status: 'degraded',
        database: 'unavailable',
        timestamp: new Date().toISOString(),
      });
    }
  }
}
