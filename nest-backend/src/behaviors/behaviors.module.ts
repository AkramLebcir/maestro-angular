import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BehaviorsController } from './behaviors.controller';
import { BehaviorsService } from './behaviors.service';
import { Behavior } from './behavior.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Behavior])],
  controllers: [BehaviorsController],
  providers: [BehaviorsService],
  exports: [BehaviorsService],
})
export class BehaviorsModule {}
