import { Module } from '@nestjs/common';
import { BehaviorsController } from './behaviors.controller';

@Module({
  controllers: [BehaviorsController],
})
export class BehaviorsModule {}




