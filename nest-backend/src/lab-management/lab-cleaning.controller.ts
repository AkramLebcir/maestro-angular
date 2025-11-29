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
import { LabCleaningService } from './lab-cleaning.service';
import { CreateLabCleaningDto } from './dto/create-lab-cleaning.dto';
import { UpdateLabCleaningDto } from './dto/update-lab-cleaning.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { ModuleAccess } from '../auth/decorators/module-access.decorator';

@Controller('lab-cleaning')
@ModuleAccess('lab-management')
export class LabCleaningController {
  constructor(private readonly service: LabCleaningService) {}

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
    @Body() dto: CreateLabCleaningDto,
  ) {
    return this.service.create(user.id, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLabCleaningDto,
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


