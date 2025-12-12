import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CouncilService } from './council.service';
import { CreateCouncilSemesterRecordDto } from './dto/create-council-semester-record.dto';
import { UpdateCouncilSemesterRecordDto } from './dto/update-council-semester-record.dto';
import { CreateFinalCouncilDecisionDto } from './dto/create-final-council-decision.dto';
import { UpdateFinalCouncilDecisionDto } from './dto/update-final-council-decision.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('council')
@UseGuards(JwtAuthGuard)
export class CouncilController {
  constructor(private readonly councilService: CouncilService) {}

  // =================== Council Semester Records ===================

  @Post('semester-records')
  createCouncilSemesterRecord(
    @Body() dto: CreateCouncilSemesterRecordDto,
    @Request() req,
  ) {
    return this.councilService.createCouncilSemesterRecord(dto, req.user.id);
  }

  @Get('semester-records')
  findAllCouncilSemesterRecords(
    @Query('classId') classId: string,
    @Query('term') term: string,
    @Request() req,
  ) {
    return this.councilService.findAllCouncilSemesterRecords(
      parseInt(classId),
      parseInt(term),
      req.user.id,
    );
  }

  @Get('semester-records/:id')
  findOneCouncilSemesterRecord(@Param('id') id: string, @Request() req) {
    return this.councilService.findOneCouncilSemesterRecord(
      parseInt(id),
      req.user.id,
    );
  }

  @Patch('semester-records/:id')
  updateCouncilSemesterRecord(
    @Param('id') id: string,
    @Body() dto: UpdateCouncilSemesterRecordDto,
    @Request() req,
  ) {
    return this.councilService.updateCouncilSemesterRecord(
      parseInt(id),
      dto,
      req.user.id,
    );
  }

  @Delete('semester-records/:id')
  deleteCouncilSemesterRecord(@Param('id') id: string, @Request() req) {
    return this.councilService.deleteCouncilSemesterRecord(
      parseInt(id),
      req.user.id,
    );
  }

  @Post('semester-records/bulk')
  bulkUpsertCouncilSemesterRecords(
    @Body() records: CreateCouncilSemesterRecordDto[],
    @Request() req,
  ) {
    return this.councilService.bulkUpsertCouncilSemesterRecords(
      records,
      req.user.id,
    );
  }

  @Get('semester-records/calculate-teacher-average/:studentId')
  calculateTeacherAverage(
    @Param('studentId') studentId: string,
    @Query('classId') classId: string,
    @Query('term') term: string,
    @Request() req,
  ) {
    return this.councilService.calculateTeacherAverage(
      parseInt(studentId),
      parseInt(classId),
      parseInt(term),
      req.user.id,
    );
  }

  // =================== Final Council Decisions ===================

  @Post('final-decisions')
  createFinalCouncilDecision(
    @Body() dto: CreateFinalCouncilDecisionDto,
    @Request() req,
  ) {
    return this.councilService.createFinalCouncilDecision(dto, req.user.id);
  }

  @Get('final-decisions')
  findAllFinalCouncilDecisions(
    @Query('classId') classId: string,
    @Request() req,
  ) {
    return this.councilService.findAllFinalCouncilDecisions(
      parseInt(classId),
      req.user.id,
    );
  }

  @Get('final-decisions/:id')
  findOneFinalCouncilDecision(@Param('id') id: string, @Request() req) {
    return this.councilService.findOneFinalCouncilDecision(
      parseInt(id),
      req.user.id,
    );
  }

  @Patch('final-decisions/:id')
  updateFinalCouncilDecision(
    @Param('id') id: string,
    @Body() dto: UpdateFinalCouncilDecisionDto,
    @Request() req,
  ) {
    return this.councilService.updateFinalCouncilDecision(
      parseInt(id),
      dto,
      req.user.id,
    );
  }

  @Delete('final-decisions/:id')
  deleteFinalCouncilDecision(@Param('id') id: string, @Request() req) {
    return this.councilService.deleteFinalCouncilDecision(
      parseInt(id),
      req.user.id,
    );
  }

  @Post('final-decisions/bulk')
  bulkUpsertFinalCouncilDecisions(
    @Body() decisions: CreateFinalCouncilDecisionDto[],
    @Request() req,
  ) {
    return this.councilService.bulkUpsertFinalCouncilDecisions(
      decisions,
      req.user.id,
    );
  }

  @Get('final-decisions/sync-term-averages/:studentId')
  syncTermAveragesFromCouncilRecords(
    @Param('studentId') studentId: string,
    @Query('classId') classId: string,
    @Request() req,
  ) {
    return this.councilService.syncTermAveragesFromCouncilRecords(
      parseInt(studentId),
      parseInt(classId),
      req.user.id,
    );
  }
}

