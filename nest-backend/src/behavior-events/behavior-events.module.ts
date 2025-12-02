import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BehaviorEventsService } from './behavior-events.service';
import { BehaviorEventsController } from './behavior-events.controller';
import { BehaviorEvent } from './behavior-event.entity';
import { Student } from '../students/student.entity';
import { Class } from '../classes/class.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BehaviorEvent, Student, Class])],
  controllers: [BehaviorEventsController],
  providers: [BehaviorEventsService],
  exports: [BehaviorEventsService],
})
export class BehaviorEventsModule {}




