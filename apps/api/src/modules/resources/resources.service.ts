import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { Actor } from '../../common/actor';
import { RESOURCES, scopeWhere, type ResourceDefinition } from './resource.registry';

export interface ListQuery {
  q?: string;
  page?: number;
  pageSize?: number;
  [key: string]: unknown;
}

const MAX_PAGE_SIZE = 100;

@Injectable()
export class ResourcesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private definition(resource: string): ResourceDefinition {
    const def = RESOURCES[resource];
    if (!def) throw new NotFoundException('Unknown resource');
    return def;
  }

  private delegate(def: ResourceDefinition) {
    // The model name comes from the registry, never from user input.
    return (this.prisma as unknown as Record<string, {
      findMany: (args: unknown) => Promise<unknown[]>;
      count: (args: unknown) => Promise<number>;
      findFirst: (args: unknown) => Promise<unknown>;
    }>)[def.model]!;
  }

  async list(resource: string, actor: Actor, query: ListQuery) {
    const def = this.definition(resource);
    if (!actor.permissions.has(def.permission)) {
      await this.audit.security('PERMISSION_DENIED', {
        userId: actor.userId, ipAddress: actor.ipAddress, severity: 'warning',
        metadata: { resource, required: def.permission },
      });
      throw new ForbiddenException('You do not have access to this resource');
    }

    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(query.pageSize) || 20));

    const where: Record<string, unknown> = {
      ...(def.baseWhere ?? {}),
      ...scopeWhere(def, actor),
    };

    const term = typeof query.q === 'string' ? query.q.trim() : '';
    if (term.length >= 2 && def.searchFields?.length) {
      where.OR = def.searchFields.map((field) => ({
        [field]: { contains: term, mode: 'insensitive' },
      }));
    }

    // Only filters the registry declares are honoured; everything else is ignored.
    for (const [key, build] of Object.entries(def.filters ?? {})) {
      const value = query[key];
      if (typeof value === 'string' && value.length > 0) {
        Object.assign(where, build(value));
      }
    }

    const delegate = this.delegate(def);
    const [rows, total] = await Promise.all([
      delegate.findMany({
        where,
        select: def.select,
        orderBy: def.orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      delegate.count({ where }),
    ]);

    return {
      rows,
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  /** Single record, re-applying the same scope so an id alone grants nothing. */
  async detail(resource: string, id: string, actor: Actor) {
    const def = this.definition(resource);
    if (!actor.permissions.has(def.permission)) {
      throw new ForbiddenException('You do not have access to this resource');
    }
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw new BadRequestException('Invalid identifier');

    const row = await this.delegate(def).findFirst({
      where: { id, ...(def.baseWhere ?? {}), ...scopeWhere(def, actor) },
      select: def.select,
    });
    if (!row) throw new NotFoundException('Not found');

    await this.audit.record({
      userId: actor.userId,
      organizationId: actor.organizationId,
      action: `${resource}.view`,
      resourceType: resource,
      resourceId: id,
    });

    return row;
  }
}
