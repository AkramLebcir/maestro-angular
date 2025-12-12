import { PartialType } from '@nestjs/mapped-types';
import { CreateCouncilSemesterRecordDto } from './create-council-semester-record.dto';

export class UpdateCouncilSemesterRecordDto extends PartialType(CreateCouncilSemesterRecordDto) {}

