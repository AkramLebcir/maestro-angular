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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { ModuleAccess } from '../auth/decorators/module-access.decorator';

@Controller('workstations')
@ModuleAccess('workstations')
export class WorkstationsController {
  constructor(private readonly workstationsService: WorkstationsService) {}

  @Get('layout')
  async getLayout(
    @CurrentUser() user: AuthUser,
    @Query('classId', ParseIntPipe) classId: number,
    @Query('group') group?: string,
  ) {
    const parsedGroup =
      group !== undefined && group !== null && group !== '' 
        ? Number(group) 
        : undefined;
    return this.workstationsService.getLayout(
      user.id,
      classId,
      parsedGroup,
    );
  }

  @Post('layout')
  async configureLayout(
    @CurrentUser() user: AuthUser,
    @Body() dto: ConfigureLayoutDto,
  ) {
    return this.workstationsService.configureLayout(user.id, dto);
  }

  @Put('assignments')
  async saveAssignments(
    @CurrentUser() user: AuthUser,
    @Body() dto: SaveAssignmentsDto,
  ) {
    return this.workstationsService.saveAssignments(user.id, dto);
  }

  @Patch('assignments/:id')
  async updateAssignmentStatus(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAssignmentStatusDto,
  ) {
    return this.workstationsService.updateAssignmentStatus(user.id, id, dto);
  }

  @Patch('positions')
  async updatePositions(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateWorkstationPositionsDto,
  ) {
    return this.workstationsService.updatePositions(user.id, dto);
  }

  @Post('print')
  async printLayouts(
    @CurrentUser() user: AuthUser,
    @Body() dto: PrintLayoutDto,
  ) {
    return this.workstationsService.getPrintableLayout(user.id, dto);
  }
}


