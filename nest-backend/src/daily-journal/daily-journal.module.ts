import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DailyJournalService } from './daily-journal.service';
import { DailyJournalController } from './daily-journal.controller';
import { DailyJournalEntry } from './daily-journal-entry.entity';
import { Class } from '../classes/class.entity';
import { Topic } from '../topics/topic.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DailyJournalEntry, Class, Topic])],
  controllers: [DailyJournalController],
  providers: [DailyJournalService],
  exports: [DailyJournalService],
})
export class DailyJournalModule {}

