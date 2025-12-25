import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { ModuleAccess } from '../auth/decorators/module-access.decorator';
import { BehaviorsService } from './behaviors.service';
import { CreateBehaviorDto } from './dto/create-behavior.dto';
import { UpdateBehaviorDto } from './dto/update-behavior.dto';
import { BehaviorResponseDto } from './dto/behavior-response.dto';

@Controller('behaviors')
@ModuleAccess('behavior-events')
export class BehaviorsController {
  constructor(private readonly behaviorsService: BehaviorsService) {}

  @Get()
  async getBehaviors(@CurrentUser() user: AuthUser): Promise<BehaviorResponseDto[]> {
    // Ensure defaults are seeded
    await this.behaviorsService.seedDefaults(user.id);
    return this.behaviorsService.findAll(user.id);
  }

  @Get(':id')
  async getBehavior(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number
  ): Promise<BehaviorResponseDto> {
    return this.behaviorsService.findOne(user.id, id);
  }

  @Post()
  async createBehavior(
    @CurrentUser() user: AuthUser,
    @Body() createBehaviorDto: CreateBehaviorDto
  ): Promise<BehaviorResponseDto> {
    return this.behaviorsService.create(user.id, createBehaviorDto);
  }

  @Put(':id')
  async updateBehavior(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBehaviorDto: UpdateBehaviorDto
  ): Promise<BehaviorResponseDto> {
    return this.behaviorsService.update(user.id, id, updateBehaviorDto);
  }

  @Delete(':id')
  async deleteBehavior(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number
  ): Promise<{ message: string }> {
    await this.behaviorsService.remove(user.id, id);
    return { message: 'Behavior deleted successfully' };
  }

  @Post('reset-defaults')
  async resetToDefaults(@CurrentUser() user: AuthUser): Promise<BehaviorResponseDto[]> {
    return this.behaviorsService.resetToDefaults(user.id);
  }
}
