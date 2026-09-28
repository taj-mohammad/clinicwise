import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@cliniqx/shared';
import { CurrentActor, RequirePermissions } from '../../common/decorators';
import type { Actor } from '../../common/actor';
import { DashboardService } from './dashboard.service';
import { PartnerDashboardService } from './partner-dashboard.service';

@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly dashboard: DashboardService,
    private readonly partners: PartnerDashboardService,
  ) {}

  @Get('doctor')
  @RequirePermissions(PERMISSIONS.CONSULTATION_VIEW)
  @ApiOperation({ summary: "The signed-in doctor's day: KPIs, OPD list and live queue" })
  async doctor(@CurrentActor() actor: Actor, @Query('locationId') locationId?: string) {
    return this.dashboard.doctorDashboard(actor, locationId);
  }

  @Get('clinic')
  @RequirePermissions(PERMISSIONS.APPOINTMENTS_VIEW)
  @ApiOperation({ summary: 'Clinic operations snapshot for today' })
  async clinic(@CurrentActor() actor: Actor, @Query('clinicId') clinicId?: string) {
    return this.dashboard.clinicDashboard(actor, clinicId);
  }

  @Get('patient')
  @ApiOperation({ summary: "The signed-in patient's next visit, queue position and records" })
  async patient(@CurrentActor() actor: Actor) {
    return this.partners.patientHome(actor);
  }

  @Get('mr')
  @RequirePermissions(PERMISSIONS.MR_LEADS_MANAGE)
  @ApiOperation({ summary: 'Field representative pipeline and targets' })
  async mr(@CurrentActor() actor: Actor) {
    return this.partners.mrDashboard(actor);
  }

  @Get('pharmacy')
  @RequirePermissions(PERMISSIONS.PHARMACY_ORDER_VIEW)
  @ApiOperation({ summary: 'Pharmacy partner order and inventory snapshot' })
  async pharmacy(@CurrentActor() actor: Actor) {
    return this.partners.pharmacyDashboard(actor);
  }

  @Get('lab')
  @RequirePermissions(PERMISSIONS.LAB_REPORT_VIEW)
  @ApiOperation({ summary: 'Lab partner order and report snapshot' })
  async lab(@CurrentActor() actor: Actor) {
    return this.partners.labDashboard(actor);
  }

  @Get('platform')
  @RequirePermissions(PERMISSIONS.ORG_VIEW)
  @ApiOperation({ summary: 'Platform-wide counts, trends and operational queues' })
  async platform() {
    return this.dashboard.platformDashboard();
  }
}
