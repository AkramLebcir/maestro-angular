import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { GradingSettingsService } from './grading-settings.service';
import { CreateGradingSettingsDto, UpdateGradingSettingsDto, BulkApplySettingsDto } from './dto/create-grading-settings.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { ModuleAccess } from '../auth/decorators/module-access.decorator';

@Controller('grading-settings')
@ModuleAccess('grades')
export class GradingSettingsController {
  constructor(private readonly gradingSettingsService: GradingSettingsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: AuthUser,
    @Body() createDto: CreateGradingSettingsDto,
  ) {
    return this.gradingSettingsService.create(user.id, createDto);
  }

  @Get()
  async findAll(@CurrentUser() user: AuthUser) {
    return this.gradingSettingsService.findAll(user.id);
  }

  @Post('bulk-apply')
  @HttpCode(HttpStatus.OK)
  async bulkApply(
    @CurrentUser() user: AuthUser,
    @Body() bulkDto: BulkApplySettingsDto,
  ) {
    return this.gradingSettingsService.bulkApply(user.id, bulkDto);
  }

  @Get('class/:classId')
  async findByClassId(
    @CurrentUser() user: AuthUser,
    @Param('classId', ParseIntPipe) classId: number,
  ) {
    const settings = await this.gradingSettingsService.findByClassId(user.id, classId);
    if (!settings) {
      return null;
    }
    return settings;
  }

  @Patch('class/:classId')
  async update(
    @CurrentUser() user: AuthUser,
    @Param('classId', ParseIntPipe) classId: number,
    @Body() updateDto: UpdateGradingSettingsDto,
  ) {
    return this.gradingSettingsService.update(user.id, classId, updateDto);
  }

  @Delete('class/:classId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: AuthUser,
    @Param('classId', ParseIntPipe) classId: number,
  ) {
    return this.gradingSettingsService.delete(user.id, classId);
  }
}

