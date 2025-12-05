import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { TenantOwnedEntity } from '../common/entities/tenant-owned.entity';
import { ClubMember } from './club-member.entity';
import { ClubEvent } from './club-event.entity';
import { User } from '../users/entities/user.entity';

@Entity('clubs')
export class Club extends TenantOwnedEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teacherId' })
  teacher: User;

  @Column()
  teacherId: number;

  @OneToMany(() => ClubMember, (member) => member.club, { cascade: true })
  members: ClubMember[];

  @OneToMany(() => ClubEvent, (event) => event.club, { cascade: true })
  events: ClubEvent[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}

