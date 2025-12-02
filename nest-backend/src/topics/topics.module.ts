import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TopicsService } from './topics.service';
import { TopicsController } from './topics.controller';
import { Topic } from './topic.entity';
import { TopicElement } from './topic-element.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Topic, TopicElement])],
  controllers: [TopicsController],
  providers: [TopicsService],
  exports: [TopicsService],
})
export class TopicsModule {}




