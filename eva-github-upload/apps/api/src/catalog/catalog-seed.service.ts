import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class CatalogSeedService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    const collection = await this.prisma.collection.upsert({
      where: { slug: 'aghaz' },
      update: {
        nameFa: 'آغاز',
        code: 'AGH',
      },
      create: {
        nameFa: 'آغاز',
        slug: 'aghaz',
        code: 'AGH',
        story: 'هر شروع، از یک نقطه شکل می‌گیرد.',
      },
    });

    const product = await this.prisma.masterProduct.upsert({
      where: { slug: 'tolou' },
      update: {
        nameFa: 'طلوع',
        masterSku: 'EVA-AGH-NEC-TOL-001',
        purity: 18,
        status: 'ACTIVE',
        collectionId: collection.id,
      },
      create: {
        nameFa: 'طلوع',
        slug: 'tolou',
        masterSku: 'EVA-AGH-NEC-TOL-001',
        purity: 18,
        status: 'ACTIVE',
        collectionId: collection.id,
      },
    });

    const units = [
      { unitSku: 'EVA-AGH-NEC-TOL-001-U01', exactWeightGram: '0.810' },
      { unitSku: 'EVA-AGH-NEC-TOL-001-U02', exactWeightGram: '0.840' },
      { unitSku: 'EVA-AGH-NEC-TOL-001-U03', exactWeightGram: '0.890' },
    ];

    for (const unit of units) {
      await this.prisma.physicalUnit.upsert({
        where: { unitSku: unit.unitSku },
        // Do not reset status, reservation or price on deploy.
        update: {
          productId: product.id,
          exactWeightGram: unit.exactWeightGram,
        },
        create: {
          unitSku: unit.unitSku,
          productId: product.id,
          exactWeightGram: unit.exactWeightGram,
          status: 'AVAILABLE',
        },
      });
    }
  }
}
