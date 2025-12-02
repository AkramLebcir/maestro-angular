import { PartialType } from '@nestjs/mapped-types';
import { CreateAnnualDistributionDto } from './create-annual-distribution.dto';

export class UpdateAnnualDistributionDto extends PartialType(CreateAnnualDistributionDto) {}




