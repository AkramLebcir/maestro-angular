import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HolidayPeriod } from './holiday-period.entity';
import { AnnualDistribution } from './annual-distribution.entity';
import { AnnualPlanningService } from './annual-planning.service';
import { AnnualPlanningController } from './annual-planning.controller';

@Module({
  imports: [TypeOrmModule.forFeature([HolidayPeriod, AnnualDistribution])],
  providers: [AnnualPlanningService],
  controllers: [AnnualPlanningController],
})
export class AnnualPlanningModule {}










