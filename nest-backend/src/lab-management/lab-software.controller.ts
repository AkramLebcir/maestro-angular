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
import { LabSoftwareService } from './lab-software.service';
import { CreateLabSoftwareDto } from './dto/create-lab-software.dto';
import { UpdateLabSoftwareDto } from './dto/update-lab-software.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { ModuleAccess } from '../auth/decorators/module-access.decorator';

@Controller('lab-software')
@ModuleAccess('lab-management')
export class LabSoftwareController {
  constructor(private readonly service: LabSoftwareService) {}

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
    @Body() dto: CreateLabSoftwareDto,
  ) {
    return this.service.create(user.id, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLabSoftwareDto,
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


