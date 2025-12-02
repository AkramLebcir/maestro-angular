import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ClassroomLayoutService } from './classroom-layout.service';
import { CreateLayoutDto } from './dto/create-layout.dto';
import { UpdateLayoutDto } from './dto/update-layout.dto';
import { SaveAssignmentsDto } from './dto/save-assignments.dto';
import { UpdateDeskPositionsDto } from './dto/update-desk-positions.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('classroom-layout')
@UseGuards(JwtAuthGuard)
export class ClassroomLayoutController {
  constructor(private readonly layoutService: ClassroomLayoutService) {}

  @Post()
  createLayout(@Request() req, @Body() createDto: CreateLayoutDto) {
    return this.layoutService.createLayout(req.user.id, createDto);
  }

  @Get('class/:classId')
  getLayout(@Request() req, @Param('classId', ParseIntPipe) classId: number) {
    return this.layoutService.getLayout(req.user.id, classId);
  }

  @Patch('positions')
  updateDeskPositions(@Request() req, @Body() updateDto: UpdateDeskPositionsDto) {
    return this.layoutService.updateDeskPositions(req.user.id, updateDto);
  }

  @Post('assignments')
  saveAssignments(@Request() req, @Body() saveDto: SaveAssignmentsDto) {
    return this.layoutService.saveAssignments(req.user.id, saveDto);
  }
}



