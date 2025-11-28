import { Column, JoinColumn, ManyToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';

/**
 * Base class for any entity owned by a specific teacher (tenant).
 * Ensures data isolation by enforcing the presence of an owner reference.
 */
export abstract class TenantOwnedEntity {
  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @Column()
  ownerId: number;
}


