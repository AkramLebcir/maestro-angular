import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { TenantOwnedEntity } from '../common/entities/tenant-owned.entity';

@Entity('certificate_templates')
export class CertificateTemplate extends TenantOwnedEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text' })
  defaultMainText: string;

  @Column({ type: 'text' })
  defaultReason: string;

  @Column()
  defaultAcademicYear: string;

  @Column({ default: 'توقيع الأستاذ' })
  defaultSignatureLabel: string;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;
}







