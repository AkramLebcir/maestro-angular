import { PartialType } from '@nestjs/mapped-types';
import { CreateFinalCouncilDecisionDto } from './create-final-council-decision.dto';

export class UpdateFinalCouncilDecisionDto extends PartialType(CreateFinalCouncilDecisionDto) {}



