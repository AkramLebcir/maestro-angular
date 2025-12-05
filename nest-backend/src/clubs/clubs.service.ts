import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Club } from './club.entity';
import { ClubMember } from './club-member.entity';
import { ClubEvent } from './club-event.entity';
import { Student } from '../students/student.entity';
import { User } from '../users/entities/user.entity';
import { CreateClubDto } from './dto/create-club.dto';
import { UpdateClubDto } from './dto/update-club.dto';
import { ClubResponseDto } from './dto/club-response.dto';
import { AddMemberDto, AddMembersDto } from './dto/add-member.dto';
import { CreateClubEventDto } from './dto/create-club-event.dto';
import { UpdateClubEventDto } from './dto/update-club-event.dto';
import { ClubEventResponseDto } from './dto/club-event-response.dto';
import { ClubMemberResponseDto } from './dto/club-member-response.dto';
import { SendAnnouncementDto } from './dto/send-announcement.dto';
import { EmailService } from './email.service';

@Injectable()
export class ClubsService {
  constructor(
    @InjectRepository(Club)
    private clubRepository: Repository<Club>,
    @InjectRepository(ClubMember)
    private clubMemberRepository: Repository<ClubMember>,
    @InjectRepository(ClubEvent)
    private clubEventRepository: Repository<ClubEvent>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private emailService: EmailService,
  ) {}

  async create(ownerId: number, createClubDto: CreateClubDto): Promise<ClubResponseDto> {
    const club = this.clubRepository.create({
      ...createClubDto,
      teacherId: ownerId,
      ownerId,
    });
    const savedClub = await this.clubRepository.save(club);
    return this.findOne(ownerId, savedClub.id);
  }

  async findAll(ownerId: number): Promise<ClubResponseDto[]> {
    const clubs = await this.clubRepository.find({
      where: { ownerId },
      relations: ['members', 'members.student', 'events'],
      order: { createdAt: 'DESC' },
    });

    return clubs.map((club) => this.mapToResponseDto(club));
  }

  async findOne(ownerId: number, id: number): Promise<ClubResponseDto> {
    const club = await this.findOwnedClub(ownerId, id, ['members', 'members.student', 'events']);
    return this.mapToResponseDto(club);
  }

  async update(ownerId: number, id: number, updateClubDto: UpdateClubDto): Promise<ClubResponseDto> {
    const club = await this.findOwnedClub(ownerId, id);
    Object.assign(club, updateClubDto);
    await this.clubRepository.save(club);
    return this.findOne(ownerId, id);
  }

  async remove(ownerId: number, id: number): Promise<void> {
    const club = await this.findOwnedClub(ownerId, id);
    await this.clubRepository.remove(club);
  }

  async addMember(ownerId: number, clubId: number, addMemberDto: AddMemberDto): Promise<ClubMemberResponseDto> {
    const club = await this.findOwnedClub(ownerId, clubId);
    
    // Check if student exists and belongs to the same owner
    const student = await this.studentRepository.findOne({
      where: { id: addMemberDto.studentId, ownerId },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${addMemberDto.studentId} not found`);
    }

    // Check if member already exists
    const existingMember = await this.clubMemberRepository.findOne({
      where: { clubId, studentId: addMemberDto.studentId, ownerId },
    });

    if (existingMember) {
      throw new BadRequestException('Student is already a member of this club');
    }

    const member = this.clubMemberRepository.create({
      clubId,
      studentId: addMemberDto.studentId,
      ownerId,
    });

    const savedMember = await this.clubMemberRepository.save(member);
    const memberWithStudent = await this.clubMemberRepository.findOne({
      where: { id: savedMember.id },
      relations: ['student'],
    });

    return this.mapMemberToResponseDto(memberWithStudent!);
  }

  async addMembers(ownerId: number, clubId: number, addMembersDto: AddMembersDto): Promise<ClubMemberResponseDto[]> {
    const club = await this.findOwnedClub(ownerId, clubId);
    const members: ClubMemberResponseDto[] = [];

    for (const studentId of addMembersDto.studentIds) {
      try {
        const member = await this.addMember(ownerId, clubId, { studentId });
        members.push(member);
      } catch (error) {
        // Skip if already a member, throw for other errors
        if (error instanceof BadRequestException && error.message.includes('already a member')) {
          continue;
        }
        throw error;
      }
    }

    return members;
  }

  async removeMember(ownerId: number, clubId: number, memberId: number): Promise<void> {
    const member = await this.clubMemberRepository.findOne({
      where: { id: memberId, clubId, ownerId },
    });

    if (!member) {
      throw new NotFoundException(`Member with ID ${memberId} not found in this club`);
    }

    await this.clubMemberRepository.remove(member);
  }

  async getMembers(ownerId: number, clubId: number): Promise<ClubMemberResponseDto[]> {
    await this.findOwnedClub(ownerId, clubId);
    
    const members = await this.clubMemberRepository.find({
      where: { clubId, ownerId },
      relations: ['student'],
      order: { joinedAt: 'DESC' },
    });

    return members.map((member) => this.mapMemberToResponseDto(member));
  }

  async createEvent(ownerId: number, clubId: number, createEventDto: CreateClubEventDto): Promise<ClubEventResponseDto> {
    await this.findOwnedClub(ownerId, clubId);

    const event = this.clubEventRepository.create({
      ...createEventDto,
      clubId,
      ownerId,
      date: new Date(createEventDto.date),
    });

    const savedEvent = await this.clubEventRepository.save(event);
    return this.mapEventToResponseDto(savedEvent);
  }

  async updateEvent(ownerId: number, clubId: number, eventId: number, updateEventDto: UpdateClubEventDto): Promise<ClubEventResponseDto> {
    const event = await this.findOwnedEvent(ownerId, clubId, eventId);

    const updateData: any = { ...updateEventDto };
    if (updateEventDto.date) {
      updateData.date = new Date(updateEventDto.date);
    }

    Object.assign(event, updateData);
    const savedEvent = await this.clubEventRepository.save(event);
    return this.mapEventToResponseDto(savedEvent);
  }

  async removeEvent(ownerId: number, clubId: number, eventId: number): Promise<void> {
    const event = await this.findOwnedEvent(ownerId, clubId, eventId);
    await this.clubEventRepository.remove(event);
  }

  async getEvents(ownerId: number, clubId: number): Promise<ClubEventResponseDto[]> {
    await this.findOwnedClub(ownerId, clubId);

    const events = await this.clubEventRepository.find({
      where: { clubId, ownerId },
      order: { date: 'DESC' },
    });

    return events.map((event) => this.mapEventToResponseDto(event));
  }

  async sendAnnouncement(ownerId: number, clubId: number, sendAnnouncementDto: SendAnnouncementDto): Promise<{ sent: number; failed: number }> {
    const club = await this.findOwnedClub(ownerId, clubId, ['members', 'members.student']);

    if (!club.members || club.members.length === 0) {
      throw new BadRequestException('Club has no members to send announcement to');
    }

    const recipients = club.members.map((member) => ({
      email: member.student?.email,
      name: `${member.student?.firstName} ${member.student?.lastName}`,
    }));

    if (sendAnnouncementDto.sendEmail) {
      return await this.emailService.sendAnnouncement(
        recipients,
        sendAnnouncementDto.subject,
        sendAnnouncementDto.message,
      );
    }

    // If not sending email, just return success for all
    return { sent: recipients.length, failed: 0 };
  }

  private mapToResponseDto(club: Club): ClubResponseDto {
    return {
      id: club.id,
      name: club.name,
      description: club.description,
      teacherId: club.teacherId,
      members: club.members?.map((member) => this.mapMemberToResponseDto(member)),
      events: club.events?.map((event) => this.mapEventToResponseDto(event)),
      createdAt: club.createdAt,
      updatedAt: club.updatedAt,
    };
  }

  private mapMemberToResponseDto(member: ClubMember): ClubMemberResponseDto {
    return {
      id: member.id,
      clubId: member.clubId,
      studentId: member.studentId,
      student: member.student
        ? {
            id: member.student.id,
            firstName: member.student.firstName,
            lastName: member.student.lastName,
            email: member.student.email,
            studentNumber: member.student.studentNumber,
            idNumber: member.student.idNumber,
            dateOfBirth: member.student.dateOfBirth,
            placeOfBirth: member.student.placeOfBirth,
            gender: member.student.gender,
            isRepeater: member.student.isRepeater,
            studentId: member.student.studentId,
            photo: member.student.photo,
            generalNotes: member.student.generalNotes,
            classId: member.student.classId,
            group: member.student.group,
            createdAt: member.student.createdAt,
            updatedAt: member.student.updatedAt,
          }
        : undefined,
      joinedAt: member.joinedAt,
      createdAt: member.createdAt,
      updatedAt: member.updatedAt,
    };
  }

  private mapEventToResponseDto(event: ClubEvent): ClubEventResponseDto {
    return {
      id: event.id,
      name: event.name,
      date: event.date,
      organizer: event.organizer,
      participationType: event.participationType,
      results: event.results,
      photos: event.photos,
      videos: event.videos,
      report: event.report,
      clubId: event.clubId,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    };
  }

  private async findOwnedClub(ownerId: number, id: number, relations: string[] = []): Promise<Club> {
    const club = await this.clubRepository.findOne({
      where: { id, ownerId },
      relations,
    });

    if (!club) {
      throw new NotFoundException(`Club with ID ${id} not found`);
    }

    return club;
  }

  private async findOwnedEvent(ownerId: number, clubId: number, eventId: number): Promise<ClubEvent> {
    const event = await this.clubEventRepository.findOne({
      where: { id: eventId, clubId, ownerId },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found in this club`);
    }

    return event;
  }
}

