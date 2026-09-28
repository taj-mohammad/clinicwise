import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { SecurityEventType } from '@cliniqx/db';

export interface AuditInput {
  organizationId?: string | null;
  clinicId?: string | null;
  userId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  patientId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Audit writes must never fail the request they describe. */
  async record(input: AuditInput): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          organizationId: input.organizationId ?? null,
          clinicId: input.clinicId ?? null,
          userId: input.userId ?? null,
          action: input.action,
          resourceType: input.resourceType,
          resourceId: input.resourceId ?? null,
          patientId: input.patientId ?? null,
          ipAddress: input.ipAddress ?? null,
          userAgent: input.userAgent ?? null,
          metadata: (input.metadata ?? undefined) as never,
        },
      });
    } catch (err) {
      this.logger.error(`Failed to write audit log for ${input.action}`, err as Error);
    }
  }

  async security(
    type: SecurityEventType,
    data: {
      userId?: string | null;
      email?: string | null;
      mobile?: string | null;
      ipAddress?: string | null;
      userAgent?: string | null;
      severity?: 'info' | 'warning' | 'critical';
      metadata?: Record<string, unknown>;
    } = {},
  ): Promise<void> {
    try {
      await this.prisma.securityEvent.create({
        data: {
          type,
          userId: data.userId ?? null,
          email: data.email ?? null,
          mobile: data.mobile ?? null,
          ipAddress: data.ipAddress ?? null,
          userAgent: data.userAgent ?? null,
          severity: data.severity ?? 'info',
          metadata: (data.metadata ?? undefined) as never,
        },
      });
    } catch (err) {
      this.logger.error(`Failed to write security event ${type}`, err as Error);
    }
  }
}
