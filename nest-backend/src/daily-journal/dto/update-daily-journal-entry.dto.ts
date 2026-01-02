import { PartialType } from '@nestjs/mapped-types';
import { CreateDailyJournalEntryDto } from './create-daily-journal-entry.dto';

export class UpdateDailyJournalEntryDto extends PartialType(CreateDailyJournalEntryDto) {}

