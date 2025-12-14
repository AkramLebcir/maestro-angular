import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ClubsService } from './clubs.service';
import { CreateClubDto } from './dto/create-club.dto';
import { UpdateClubDto } from './dto/update-club.dto';
import { ClubResponseDto } from './dto/club-response.dto';
import { AddMemberDto, AddMembersDto } from './dto/add-member.dto';
import { CreateClubEventDto } from './dto/create-club-event.dto';
import { UpdateClubEventDto } from './dto/update-club-event.dto';
import { ClubEventResponseDto } from './dto/club-event-response.dto';
import { ClubMemberResponseDto } from './dto/club-member-response.dto';
import { SendAnnouncementDto } from './dto/send-announcement.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { ModuleAccess } from '../auth/decorators/module-access.decorator';

@Controller('clubs')
@ModuleAccess('clubs')
export class ClubsController {
  constructor(private readonly clubsService: ClubsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: AuthUser,
    @Body() createClubDto: CreateClubDto,
  ): Promise<ClubResponseDto> {
    return this.clubsService.create(user.id, createClubDto);
  }

  @Get()
  async findAll(@CurrentUser() user: AuthUser): Promise<ClubResponseDto[]> {
    return this.clubsService.findAll(user.id);
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ClubResponseDto> {
    return this.clubsService.findOne(user.id, id);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateClubDto: UpdateClubDto,
  ): Promise<ClubResponseDto> {
    return this.clubsService.update(user.id, id, updateClubDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return this.clubsService.remove(user.id, id);
  }

  // Member management
  @Post(':id/members')
  @HttpCode(HttpStatus.CREATED)
  async addMember(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) clubId: number,
    @Body() addMemberDto: AddMemberDto,
  ): Promise<ClubMemberResponseDto> {
    return this.clubsService.addMember(user.id, clubId, addMemberDto);
  }

  @Post(':id/members/bulk')
  @HttpCode(HttpStatus.CREATED)
  async addMembers(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) clubId: number,
    @Body() addMembersDto: AddMembersDto,
  ): Promise<ClubMemberResponseDto[]> {
    return this.clubsService.addMembers(user.id, clubId, addMembersDto);
  }

  @Get(':id/members')
  async getMembers(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) clubId: number,
  ): Promise<ClubMemberResponseDto[]> {
    return this.clubsService.getMembers(user.id, clubId);
  }

  @Delete(':id/members/:memberId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMember(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) clubId: number,
    @Param('memberId', ParseIntPipe) memberId: number,
  ): Promise<void> {
    return this.clubsService.removeMember(user.id, clubId, memberId);
  }

  // Event management
  @Post(':id/events')
  @HttpCode(HttpStatus.CREATED)
  async createEvent(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) clubId: number,
    @Body() createEventDto: CreateClubEventDto,
  ): Promise<ClubEventResponseDto> {
    return this.clubsService.createEvent(user.id, clubId, createEventDto);
  }

  @Get(':id/events')
  async getEvents(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) clubId: number,
  ): Promise<ClubEventResponseDto[]> {
    return this.clubsService.getEvents(user.id, clubId);
  }

  @Patch(':id/events/:eventId')
  async updateEvent(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) clubId: number,
    @Param('eventId', ParseIntPipe) eventId: number,
    @Body() updateEventDto: UpdateClubEventDto,
  ): Promise<ClubEventResponseDto> {
    return this.clubsService.updateEvent(user.id, clubId, eventId, updateEventDto);
  }

  @Delete(':id/events/:eventId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeEvent(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) clubId: number,
    @Param('eventId', ParseIntPipe) eventId: number,
  ): Promise<void> {
    return this.clubsService.removeEvent(user.id, clubId, eventId);
  }

  // Announcements
  @Post(':id/announcements')
  @HttpCode(HttpStatus.OK)
  async sendAnnouncement(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) clubId: number,
    @Body() sendAnnouncementDto: SendAnnouncementDto,
  ): Promise<{ sent: number; failed: number }> {
    return this.clubsService.sendAnnouncement(user.id, clubId, sendAnnouncementDto);
  }
}






