import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { WorkstationsService } from './workstations.service';
import { ConfigureLayoutDto } from './dto/configure-layout.dto';
import { SaveAssignmentsDto } from './dto/save-assignments.dto';
import { UpdateAssignmentStatusDto } from './dto/update-assignment-status.dto';
import { PrintLayoutDto } from './dto/print-layout.dto';
import { UpdateWorkstationPositionsDto } from './dto/update-workstation-positions.dto';

@Controller('workstations')
export class WorkstationsController {
  constructor(private readonly workstationsService: WorkstationsService) {}

  @Get('layout')
  async getLayout(
    @Query('classId', ParseIntPipe) classId: number,
    @Query('group') group?: string,
  ) {
    const parsedGroup =
      group !== undefined && group !== null ? Number(group) : undefined;
    return this.workstationsService.getLayout(
      classId,
      parsedGroup as number | undefined,
    );
  }

  @Post('layout')
  async configureLayout(@Body() dto: ConfigureLayoutDto) {
    return this.workstationsService.configureLayout(dto);
  }

  @Put('assignments')
  async saveAssignments(@Body() dto: SaveAssignmentsDto) {
    return this.workstationsService.saveAssignments(dto);
  }

  @Patch('assignments/:id')
  async updateAssignmentStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAssignmentStatusDto,
  ) {
    return this.workstationsService.updateAssignmentStatus(id, dto);
  }

  @Patch('positions')
  async updatePositions(@Body() dto: UpdateWorkstationPositionsDto) {
    return this.workstationsService.updatePositions(dto);
  }

  @Post('print')
  async printLayouts(@Body() dto: PrintLayoutDto) {
    return this.workstationsService.getPrintableLayout(dto);
  }
}


