import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ComputerChecklistService } from './computer-checklist.service';
import { CreateComputerChecklistDto } from './dto/create-computer-checklist.dto';
import { UpdateComputerChecklistDto } from './dto/update-computer-checklist.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { ModuleAccess } from '../auth/decorators/module-access.decorator';

@Controller('computer-checklists')
@ModuleAccess('lab-management')
export class ComputerChecklistController {
  constructor(private readonly service: ComputerChecklistService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('labId') labId?: string,
  ) {
    return this.service.findAll(user.id, labId ? Number(labId) : undefined);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.findOne(user.id, id);
  }

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateComputerChecklistDto,
  ) {
    return this.service.create(user.id, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateComputerChecklistDto,
  ) {
    return this.service.update(user.id, id, dto);
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.remove(user.id, id);
  }
}


