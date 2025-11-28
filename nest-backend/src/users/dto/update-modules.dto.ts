import { IsArray, IsString } from 'class-validator';

export class UpdateModulesDto {
  @IsArray()
  @IsString({ each: true })
  modules: string[];
}


