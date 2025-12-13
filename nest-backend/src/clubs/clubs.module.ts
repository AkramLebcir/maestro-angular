import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClubsService } from './clubs.service';
import { ClubsController } from './clubs.controller';
import { Club } from './club.entity';
import { ClubMember } from './club-member.entity';
import { ClubEvent } from './club-event.entity';
import { Student } from '../students/student.entity';
import { User } from '../users/entities/user.entity';
import { EmailService } from './email.service';

@Module({
  imports: [TypeOrmModule.forFeature([Club, ClubMember, ClubEvent, Student, User])],
  controllers: [ClubsController],
  providers: [ClubsService, EmailService],
  exports: [ClubsService],
})
export class ClubsModule {}





