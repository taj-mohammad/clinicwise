import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { PartnerDashboardService } from './partner-dashboard.service';

@Module({ controllers: [DashboardController], providers: [DashboardService, PartnerDashboardService] })
export class DashboardModule {}
