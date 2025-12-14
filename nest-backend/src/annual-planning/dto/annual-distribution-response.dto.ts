export class AnnualDistributionResponseDto {
  id: number;
  year: string;
  level: string;
  track: string;
  term: number;
  weekNumber: number;
  yearStartDate: string;
  unitTitle: string;
  domain: string;
  notes?: string;

  // Computed fields
  computedStartDate?: string;
  computedEndDate?: string;
}










