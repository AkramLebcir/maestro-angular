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
import { LabsService } from './labs.service';
import { CreateLabDto } from './dto/create-lab.dto';
import { UpdateLabDto } from './dto/update-lab.dto';
import { LabResponseDto } from './dto/lab-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { ModuleAccess } from '../auth/decorators/module-access.decorator';

@Controller('labs')
@ModuleAccess('labs')
export class LabsController {
  constructor(private readonly labsService: LabsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: AuthUser,
    @Body() createLabDto: CreateLabDto,
  ): Promise<LabResponseDto> {
    return this.labsService.create(user.id, createLabDto);
  }

  @Get()
  async findAll(@CurrentUser() user: AuthUser): Promise<LabResponseDto[]> {
    return this.labsService.findAll(user.id);
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<LabResponseDto> {
    return this.labsService.findOne(user.id, id);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLabDto: UpdateLabDto,
  ): Promise<LabResponseDto> {
    return this.labsService.update(user.id, id, updateLabDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return this.labsService.remove(user.id, id);
  }
}


