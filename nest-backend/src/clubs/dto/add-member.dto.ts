import { IsInt, IsArray } from 'class-validator';

export class AddMemberDto {
  @IsInt()
  studentId: number;
}

export class AddMembersDto {
  @IsArray()
  @IsInt({ each: true })
  studentIds: number[];
}

