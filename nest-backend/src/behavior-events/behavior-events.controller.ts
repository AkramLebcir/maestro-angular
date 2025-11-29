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
import { BehaviorEventsService } from './behavior-events.service';
import { CreateBehaviorEventDto } from './dto/create-behavior-event.dto';
import { UpdateBehaviorEventDto } from './dto/update-behavior-event.dto';
import { BehaviorEventResponseDto } from './dto/behavior-event-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { ModuleAccess } from '../auth/decorators/module-access.decorator';

@Controller('behavior-events')
@ModuleAccess('behavior-events')
export class BehaviorEventsController {
  constructor(private readonly behaviorEventsService: BehaviorEventsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: AuthUser,
    @Body() createBehaviorEventDto: CreateBehaviorEventDto,
  ): Promise<BehaviorEventResponseDto> {
    return this.behaviorEventsService.create(user.id, createBehaviorEventDto);
  }

  @Get()
  async findAll(
    @CurrentUser() user: AuthUser,
    @Query('studentId') studentId?: string,
    @Query('classId') classId?: string,
  ): Promise<BehaviorEventResponseDto[]> {
    const query: { studentId?: number; classId?: number } = {};
    
    if (studentId) {
      query.studentId = parseInt(studentId, 10);
    }
    
    if (classId) {
      query.classId = parseInt(classId, 10);
    }

    return this.behaviorEventsService.findAll(user.id, Object.keys(query).length > 0 ? query : undefined);
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<BehaviorEventResponseDto> {
    return this.behaviorEventsService.findOne(user.id, id);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBehaviorEventDto: UpdateBehaviorEventDto,
  ): Promise<BehaviorEventResponseDto> {
    return this.behaviorEventsService.update(user.id, id, updateBehaviorEventDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return this.behaviorEventsService.remove(user.id, id);
  }
}


