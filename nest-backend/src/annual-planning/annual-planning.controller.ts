import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Patch,
} from '@nestjs/common';
import { AnnualPlanningService } from './annual-planning.service';
import { CreateHolidayPeriodDto } from './dto/create-holiday-period.dto';
import { UpdateHolidayPeriodDto } from './dto/update-holiday-period.dto';
import { HolidayPeriodResponseDto } from './dto/holiday-period-response.dto';
import { CreateAnnualDistributionDto } from './dto/create-annual-distribution.dto';
import { UpdateAnnualDistributionDto } from './dto/update-annual-distribution.dto';
import { AnnualDistributionResponseDto } from './dto/annual-distribution-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { ModuleAccess } from '../auth/decorators/module-access.decorator';

@Controller('annual-planning')
@ModuleAccess('annual-planning')
export class AnnualPlanningController {
  constructor(private readonly service: AnnualPlanningService) {}

  // Holidays endpoints
  @Post('holidays')
  @HttpCode(HttpStatus.CREATED)
  async createHoliday(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateHolidayPeriodDto,
  ): Promise<HolidayPeriodResponseDto> {
    return this.service.createHoliday(user.id, dto);
  }

  @Get('holidays')
  async getHolidays(
    @CurrentUser() user: AuthUser,
    @Query('year') year?: string,
  ): Promise<HolidayPeriodResponseDto[]> {
    return this.service.findAllHolidays(user.id, year);
  }

  @Patch('holidays/:id')
  async updateHoliday(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateHolidayPeriodDto,
  ): Promise<HolidayPeriodResponseDto> {
    return this.service.updateHoliday(user.id, id, dto);
  }

  @Delete('holidays/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeHoliday(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return this.service.removeHoliday(user.id, id);
  }

  // Distributions endpoints
  @Post('distributions')
  @HttpCode(HttpStatus.CREATED)
  async createDistribution(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateAnnualDistributionDto,
  ): Promise<AnnualDistributionResponseDto> {
    return this.service.createDistribution(user.id, dto);
  }

  @Get('distributions')
  async getDistributions(
    @CurrentUser() user: AuthUser,
    @Query('year') year?: string,
    @Query('level') level?: string,
    @Query('track') track?: string,
  ): Promise<AnnualDistributionResponseDto[]> {
    return this.service.findAllDistributions(user.id, { year, level, track });
  }

  @Get('distributions/scheduled')
  async getScheduledDistributions(
    @CurrentUser() user: AuthUser,
    @Query('year') year: string,
    @Query('level') level?: string,
    @Query('track') track?: string,
  ): Promise<AnnualDistributionResponseDto[]> {
    return this.service.getScheduledDistributions(user.id, { year, level, track });
  }

  @Patch('distributions/:id')
  async updateDistribution(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAnnualDistributionDto,
  ): Promise<AnnualDistributionResponseDto> {
    return this.service.updateDistribution(user.id, id, dto);
  }

  @Delete('distributions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeDistribution(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return this.service.removeDistribution(user.id, id);
  }
}


