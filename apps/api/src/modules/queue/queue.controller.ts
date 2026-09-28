import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@cliniqx/shared';
import { CurrentActor, RequirePermissions } from '../../common/decorators';
import type { Actor } from '../../common/actor';
import { QueueService } from './queue.service';

@ApiTags('queue')
@Controller()
export class QueueController {
  constructor(private readonly queue: QueueService) {}

  @Get('queue/today')
  @RequirePermissions(PERMISSIONS.QUEUE_VIEW)
  @ApiOperation({ summary: "Today's live queues for the caller's doctor or clinics" })
  today(@CurrentActor() actor: Actor) {
    return this.queue.todaysQueues(actor);
  }

  @Get('roles/matrix')
  @RequirePermissions(PERMISSIONS.SECURITY_MANAGE)
  @ApiOperation({ summary: 'Every role with its effective permissions' })
  roles(@CurrentActor() actor: Actor) {
    return this.queue.roleMatrix(actor);
  }
}
