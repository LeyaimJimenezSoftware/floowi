import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BookingEntity } from '../bookings/booking.entity';
import { PackageEntity } from '../packages/package.entity';
import { PaymentEntity } from '../payments/payment.entity';
import { SessionEntity } from '../sessions/session.entity';
import { StudentPackageEntity } from '../student-packages/student-package.entity';
import { UserEntity } from '../users/user.entity';

@Entity({ name: 'tenants' })
export class TenantEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true, length: 100 })
  slug!: string;

  @Column({ length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'studio_type', type: 'varchar', length: 50, nullable: true })
  studioType!: string | null;

  @Column({ name: 'logo_url', type: 'varchar', length: 500, nullable: true })
  logoUrl!: string | null;

  @Column({ name: 'cover_image_url', type: 'varchar', length: 500, nullable: true })
  coverImageUrl!: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  address!: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude!: string | null;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  instagram!: string | null;

  @Column({ name: 'theme_color', length: 7, default: '#4A7C6F' })
  themeColor!: string;

  @Column({ length: 100, default: 'DM Sans' })
  typography!: string;

  @Column({ length: 50, default: 'America/Mexico_City' })
  timezone!: string;

  @Column({ name: 'business_hours', type: 'jsonb', nullable: true })
  businessHours!: Record<string, unknown> | null;

  @Column({ name: 'onboarding_completed_at', type: 'timestamp', nullable: true })
  onboardingCompletedAt!: Date | null;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => UserEntity, (user) => user.tenant)
  users!: UserEntity[];

  @OneToMany(() => PackageEntity, (packageEntity) => packageEntity.tenant)
  packages!: PackageEntity[];

  @OneToMany(() => SessionEntity, (session) => session.tenant)
  sessions!: SessionEntity[];

  @OneToMany(() => BookingEntity, (booking) => booking.tenant)
  bookings!: BookingEntity[];

  @OneToMany(() => StudentPackageEntity, (studentPackage) => studentPackage.tenant)
  studentPackages!: StudentPackageEntity[];

  @OneToMany(() => PaymentEntity, (payment) => payment.tenant)
  payments!: PaymentEntity[];
}
