import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentActor } from '../../common/decorators';
import type { Actor } from '../../common/actor';
import { ResourcesService } from './resources.service';
import { resourceNames } from './resource.registry';

/**
 * Uniform, permission-scoped read access to the platform's list resources.
 * Each resource declares its own permission and tenancy rule in the registry.
 */
@ApiTags('resources')
@Controller('resources')
export class ResourcesController {
  constructor(private readonly resources: ResourcesService) {}

  @Get()
  @ApiOperation({ summary: 'Names of every listable resource' })
  index() {
    return { resources: resourceNames() };
  }

  @Get(':resource')
  @ApiOperation({ summary: 'Paged, filtered list scoped to the caller' })
  list(
    @Param('resource') resource: string,
    @CurrentActor() actor: Actor,
    @Query() query: Record<string, string>,
  ) {
    return this.resources.list(resource, actor, query);
  }

  @Get(':resource/:id')
  @ApiOperation({ summary: 'A single record, re-checked against the caller’s scope' })
  detail(
    @Param('resource') resource: string,
    @Param('id') id: string,
    @CurrentActor() actor: Actor,
  ) {
    return this.resources.detail(resource, id, actor);
  }
}
