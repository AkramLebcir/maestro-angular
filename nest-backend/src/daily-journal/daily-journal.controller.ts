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
} from '@nestjs/common';
import { DailyJournalService } from './daily-journal.service';
import { CreateDailyJournalEntryDto } from './dto/create-daily-journal-entry.dto';
import { UpdateDailyJournalEntryDto } from './dto/update-daily-journal-entry.dto';
import { DailyJournalEntryResponseDto } from './dto/daily-journal-entry-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { ModuleAccess } from '../auth/decorators/module-access.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('daily-journal')
@ModuleAccess('daily-journal')
export class DailyJournalController {
  constructor(private readonly dailyJournalService: DailyJournalService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: AuthUser,
    @Body() createDto: CreateDailyJournalEntryDto,
  ): Promise<DailyJournalEntryResponseDto> {
    return this.dailyJournalService.create(user.id, createDto);
  }

  @Get()
  async findAll(@CurrentUser() user: AuthUser): Promise<DailyJournalEntryResponseDto[]> {
    return this.dailyJournalService.findAll(user.id, user.role);
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<DailyJournalEntryResponseDto> {
    return this.dailyJournalService.findOne(user.id, id);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateDailyJournalEntryDto,
  ): Promise<DailyJournalEntryResponseDto> {
    return this.dailyJournalService.update(user.id, id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return this.dailyJournalService.remove(user.id, id);
  }
}

