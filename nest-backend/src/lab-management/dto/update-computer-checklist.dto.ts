import { PartialType } from '@nestjs/mapped-types';
import { CreateComputerChecklistDto } from './create-computer-checklist.dto';

export class UpdateComputerChecklistDto extends PartialType(CreateComputerChecklistDto) {}


