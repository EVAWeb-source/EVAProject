import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  listProducts() {
    return this.prisma.masterProduct.findMany({
      where: { status: 'ACTIVE' },
      include: {
        collection: true,
        units: {
          where: { status: 'AVAILABLE' },
          orderBy: { exactWeightGram: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
