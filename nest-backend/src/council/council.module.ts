import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CouncilService } from './council.service';
import { CouncilController } from './council.controller';
import { CouncilSemesterRecord } from './entities/council-semester-record.entity';
import { FinalCouncilDecision } from './entities/final-council-decision.entity';
import { Grade } from '../grades/grade.entity';
import { Student } from '../students/student.entity';
import { Class } from '../classes/class.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CouncilSemesterRecord,
      FinalCouncilDecision,
      Grade,
      Student,
      Class,
    ]),
  ],
  controllers: [CouncilController],
  providers: [CouncilService],
  exports: [CouncilService],
})
export class CouncilModule {}


