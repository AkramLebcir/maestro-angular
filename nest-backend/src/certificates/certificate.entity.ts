import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Student } from '../students/student.entity';
import { CertificateTemplate } from './certificate-template.entity';
import { TenantOwnedEntity } from '../common/entities/tenant-owned.entity';

@Entity('certificates')
export class Certificate extends TenantOwnedEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studentId' })
  student: Student;

  @Column()
  studentId: number;

  @ManyToOne(() => CertificateTemplate, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'templateId' })
  template?: CertificateTemplate;

  @Column({ nullable: true })
  templateId: number;

  @Column({ type: 'text' })
  mainText: string;

  @Column({ type: 'text' })
  reason: string;

  @Column({ type: 'date' })
  issueDate: Date;

  @Column()
  academicYear: string;

  @Column()
  signatureName: string;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;
}



