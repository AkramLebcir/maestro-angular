import { IsNumber, IsEnum, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { SeatPosition } from '../entities/desk-assignment.entity';

class AssignmentInput {
  @IsNumber()
  deskId: number;

  @IsNumber()
  studentId: number;

  @IsEnum(SeatPosition)
  @IsOptional()
  seatPosition?: SeatPosition;
}

export class SaveAssignmentsDto {
  @IsNumber()
  classId: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssignmentInput)
  assignments: AssignmentInput[];
}


