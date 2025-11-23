import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotebooksService } from './notebooks.service';
import { NotebooksController } from './notebooks.controller';
import { Notebook } from './notebook.entity';
import { CourseEntry } from './course-entry.entity';
import { Class } from '../classes/class.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Notebook, CourseEntry, Class])],
  controllers: [NotebooksController],
  providers: [NotebooksService],
  exports: [NotebooksService],
})
export class NotebooksModule {}

