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

@Controller('annual-planning')
export class AnnualPlanningController {
  constructor(private readonly service: AnnualPlanningService) {}

  // Holidays endpoints
  @Post('holidays')
  @HttpCode(HttpStatus.CREATED)
  async createHoliday(
    @Body() dto: CreateHolidayPeriodDto,
  ): Promise<HolidayPeriodResponseDto> {
    return this.service.createHoliday(dto);
  }

  @Get('holidays')
  async getHolidays(
    @Query('year') year?: string,
  ): Promise<HolidayPeriodResponseDto[]> {
    return this.service.findAllHolidays(year);
  }

  @Patch('holidays/:id')
  async updateHoliday(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateHolidayPeriodDto,
  ): Promise<HolidayPeriodResponseDto> {
    return this.service.updateHoliday(id, dto);
  }

  @Delete('holidays/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeHoliday(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.service.removeHoliday(id);
  }

  // Distributions endpoints
  @Post('distributions')
  @HttpCode(HttpStatus.CREATED)
  async createDistribution(
    @Body() dto: CreateAnnualDistributionDto,
  ): Promise<AnnualDistributionResponseDto> {
    return this.service.createDistribution(dto);
  }

  @Get('distributions')
  async getDistributions(
    @Query('year') year?: string,
    @Query('level') level?: string,
    @Query('track') track?: string,
  ): Promise<AnnualDistributionResponseDto[]> {
    return this.service.findAllDistributions({ year, level, track });
  }

  @Get('distributions/scheduled')
  async getScheduledDistributions(
    @Query('year') year: string,
    @Query('level') level?: string,
    @Query('track') track?: string,
  ): Promise<AnnualDistributionResponseDto[]> {
    return this.service.getScheduledDistributions({ year, level, track });
  }

  @Patch('distributions/:id')
  async updateDistribution(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAnnualDistributionDto,
  ): Promise<AnnualDistributionResponseDto> {
    return this.service.updateDistribution(id, dto);
  }

  @Delete('distributions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeDistribution(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.service.removeDistribution(id);
  }
}


