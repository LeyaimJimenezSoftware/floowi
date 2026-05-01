import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BookingStatus } from '../common/enums/booking-status.enum';
import { SessionEntity } from '../sessions/session.entity';
import { StudentPackageEntity } from '../student-packages/student-package.entity';
import { TenantEntity } from '../tenants/tenant.entity';
import { UserEntity } from '../users/user.entity';

@Entity({ name: 'bookings' })
@Index('idx_bookings_tenant_user', ['tenantId', 'userId'])
@Index('uq_bookings_user_session', ['userId', 'sessionId'], { unique: true })
export class BookingEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'session_id', type: 'uuid' })
  sessionId!: string;

  @Column({ name: 'student_package_id', type: 'uuid' })
  studentPackageId!: string;

  @Column({ type: 'varchar', length: 20, default: BookingStatus.Confirmed })
  status!: BookingStatus;

  @Column({ name: 'cancelled_at', type: 'timestamp', nullable: true })
  cancelledAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => TenantEntity, (tenant) => tenant.bookings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant!: TenantEntity;

  @ManyToOne(() => UserEntity, (user) => user.bookings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @ManyToOne(() => SessionEntity, (session) => session.bookings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'session_id' })
  session!: SessionEntity;

  @ManyToOne(() => StudentPackageEntity, (studentPackage) => studentPackage.bookings, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'student_package_id' })
  studentPackage!: StudentPackageEntity;
}
