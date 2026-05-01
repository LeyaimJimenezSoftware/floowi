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
import { StudentPackageStatus } from '../common/enums/student-package-status.enum';
import { PackageEntity } from '../packages/package.entity';
import { PaymentEntity } from '../payments/payment.entity';
import { TenantEntity } from '../tenants/tenant.entity';
import { UserEntity } from '../users/user.entity';

@Entity({ name: 'student_packages' })
@Index('idx_student_packages_user', ['userId', 'status'])
@Index('idx_student_packages_tenant_status', ['tenantId', 'status'])
export class StudentPackageEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'package_id', type: 'uuid' })
  packageId!: string;

  @Column({ name: 'payment_id', type: 'uuid', nullable: true })
  paymentId!: string | null;

  @Column({ name: 'classes_remaining', type: 'integer' })
  classesRemaining!: number;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt!: Date;

  @Column({ type: 'varchar', length: 20, default: StudentPackageStatus.Active })
  status!: StudentPackageStatus;

  @Column({ name: 'expiring_email_sent', default: false })
  expiringEmailSent!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => TenantEntity, (tenant) => tenant.studentPackages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant!: TenantEntity;

  @ManyToOne(() => UserEntity, (user) => user.studentPackages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @ManyToOne(() => PackageEntity, (packageEntity) => packageEntity.studentPackages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'package_id' })
  package!: PackageEntity;

  @ManyToOne(() => PaymentEntity, (payment) => payment.studentPackages, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'payment_id' })
  payment!: PaymentEntity | null;

  @OneToMany(() => BookingEntity, (booking) => booking.studentPackage)
  bookings!: BookingEntity[];
}
