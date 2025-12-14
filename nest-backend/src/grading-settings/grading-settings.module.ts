import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GradingSettingsService } from './grading-settings.service';
import { GradingSettingsController } from './grading-settings.controller';
import { GradingSettings } from './grading-settings.entity';
import { Class } from '../classes/class.entity';

@Module({
  imports: [TypeOrmModule.forFeature([GradingSettings, Class])],
  controllers: [GradingSettingsController],
  providers: [GradingSettingsService],
  exports: [GradingSettingsService],
})
export class GradingSettingsModule {}






