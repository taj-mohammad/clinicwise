import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@cliniqx/shared';
import { CurrentActor, RequirePermissions } from '../../common/decorators';
import type { Actor } from '../../common/actor';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('messages')
@Controller('messages')
export class MessagesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('conversations')
  @RequirePermissions(PERMISSIONS.MESSAGES_VIEW)
  @ApiOperation({ summary: 'Conversations the caller participates in' })
  async conversations(@CurrentActor() actor: Actor) {
    // Membership is the authorisation: a thread is only visible to its participants.
    const rows = await this.prisma.conversation.findMany({
      where: { participants: { some: { userId: actor.userId } } },
      orderBy: { lastMessageAt: 'desc' },
      take: 50,
      select: {
        id: true, subject: true, lastMessageAt: true, isArchived: true,
        doctor: { select: { user: { select: { fullName: true } } } },
        patient: { select: { fullName: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { body: true, createdAt: true },
        },
      },
    });

    return { rows, total: rows.length };
  }
}
