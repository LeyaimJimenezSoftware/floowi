import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BookingEntity } from '../bookings/booking.entity';
import { SessionStatus } from '../common/enums/session-status.enum';
import { TenantEntity } from '../tenants/tenant.entity';
import { UserEntity } from '../users/user.entity';

@Entity({ name: 'sessions' })
@Index('idx_sessions_tenant_start', ['tenantId', 'startTime'])
export class SessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'instructor_id', type: 'uuid', nullable: true })
  instructorId!: string | null;

  @Column({ length: 255 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'start_time', type: 'timestamp' })
  startTime!: Date;

  @Column({ name: 'end_time', type: 'timestamp' })
  endTime!: Date;

  @Column({ name: 'max_capacity', type: 'integer', default: 10 })
  maxCapacity!: number;

  @Column({ name: 'current_bookings', type: 'integer', default: 0 })
  currentBookings!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location!: string | null;

  @Column({ type: 'varchar', length: 20, default: SessionStatus.Scheduled })
  status!: SessionStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => TenantEntity, (tenant) => tenant.sessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant!: TenantEntity;

  @ManyToOne(() => UserEntity, (user) => user.sessions, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'instructor_id' })
  instructor!: UserEntity | null;

  @OneToMany(() => BookingEntity, (booking) => booking.session)
  bookings!: BookingEntity[];
}
