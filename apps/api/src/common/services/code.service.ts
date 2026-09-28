import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../modules/prisma/prisma.service';

export type CodeSequence =
  | 'PT' | 'ST' | 'AP' | 'CN' | 'RX' | 'LB' | 'PH'
  | 'INV' | 'PAY' | 'PS' | 'DR' | 'MR' | 'ORG' | 'CL' | 'LOC' | 'EXP';

/**
 * Human-readable business identifiers (CLX-PT-000001), backed by an atomic
 * upsert so concurrent registrations cannot produce the same number.
 */
@Injectable()
export class CodeService {
  constructor(private readonly prisma: PrismaService) {}

  async next(sequence: CodeSequence, prefix = 'CLX', width = 6): Promise<string> {
    const rows = await this.prisma.$queryRaw<{ value: number }[]>`
      INSERT INTO counters (key, value, "updatedAt")
      VALUES (${sequence}, 1, now())
      ON CONFLICT (key) DO UPDATE SET value = counters.value + 1, "updatedAt" = now()
      RETURNING value
    `;
    const value = rows[0]?.value ?? 1;
    return `${prefix}-${sequence}-${String(value).padStart(width, '0')}`;
  }
}
