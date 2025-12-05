import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { TenantOwnedEntity } from '../common/entities/tenant-owned.entity';
import { Club } from './club.entity';

export enum EventParticipationType {
  PRESENTATION = 'presentation',
  COMPETITION = 'competition',
  WORKSHOP = 'workshop',
}

@Entity('club_events')
export class ClubEvent extends TenantOwnedEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({ nullable: true })
  organizer: string;

  @Column({
    type: 'enum',
    enum: EventParticipationType,
    nullable: true,
  })
  participationType: EventParticipationType;

  @Column({ type: 'text', nullable: true })
  results: string;

  @Column({ type: 'json', nullable: true })
  photos: string[]; // Array of photo URLs or base64 strings

  @Column({ type: 'json', nullable: true })
  videos: string[]; // Array of video URLs

  @Column({ type: 'text', nullable: true })
  report: string; // Comprehensive report text

  @ManyToOne(() => Club, (club) => club.events, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clubId' })
  club: Club;

  @Column()
  clubId: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}

