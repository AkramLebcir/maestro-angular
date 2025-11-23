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

@Controller('behavior-events')
export class BehaviorEventsController {
  constructor(private readonly behaviorEventsService: BehaviorEventsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createBehaviorEventDto: CreateBehaviorEventDto): Promise<BehaviorEventResponseDto> {
    return this.behaviorEventsService.create(createBehaviorEventDto);
  }

  @Get()
  async findAll(
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

    return this.behaviorEventsService.findAll(Object.keys(query).length > 0 ? query : undefined);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<BehaviorEventResponseDto> {
    return this.behaviorEventsService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBehaviorEventDto: UpdateBehaviorEventDto,
  ): Promise<BehaviorEventResponseDto> {
    return this.behaviorEventsService.update(id, updateBehaviorEventDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.behaviorEventsService.remove(id);
  }
}

