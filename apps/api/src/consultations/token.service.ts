import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TokenService {
  constructor(private readonly prisma: PrismaService) {}

  /** Generates sequential token like TM-20261108-00042 (UTC date). */
  async nextToken(): Promise<string> {
    const now = new Date();
    const dateKey = now.toISOString().slice(0, 10).replace(/-/g, '');

    const result = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.tokenCounter.findUnique({ where: { dateKey } });
      if (!existing) {
        // Ensure single default row pattern per date
        const created = await tx.tokenCounter.create({
          data: { id: dateKey, dateKey, lastValue: 1 },
        });
        return created.lastValue;
      }
      const updated = await tx.tokenCounter.update({
        where: { dateKey },
        data: { lastValue: { increment: 1 } },
      });
      return updated.lastValue;
    });

    return `TM-${dateKey}-${String(result).padStart(5, '0')}`;
  }
}
