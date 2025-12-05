import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class SendAnnouncementDto {
  @IsString()
  subject: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsBoolean()
  sendEmail?: boolean;
}

