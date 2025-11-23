import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotebooksService } from './notebooks.service';
import { NotebooksController } from './notebooks.controller';
import { Notebook } from './notebook.entity';
import { CourseEntry } from './course-entry.entity';
import { Class } from '../classes/class.entity';
import { Topic } from '../topics/topic.entity';
import { TopicElement } from '../topics/topic-element.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Notebook, CourseEntry, Class, Topic, TopicElement])],
  controllers: [NotebooksController],
  providers: [NotebooksService],
  exports: [NotebooksService],
})
export class NotebooksModule {}

