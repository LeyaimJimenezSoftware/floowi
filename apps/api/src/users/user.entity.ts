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
import { UserRole } from '../common/enums/user-role.enum';
import { BookingEntity } from '../bookings/booking.entity';
import { PaymentEntity } from '../payments/payment.entity';
import { RefreshTokenEntity } from '../auth/refresh-token.entity';
import { SessionEntity } from '../sessions/session.entity';
import { StudentPackageEntity } from '../student-packages/student-package.entity';
import { TenantEntity } from '../tenants/tenant.entity';

@Entity({ name: 'users' })
@Index('idx_users_tenant_email', ['tenantId', 'email'])
@Index('uq_users_tenant_email', ['tenantId', 'email'], { unique: true })
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ length: 255 })
  email!: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255, nullable: true })
  passwordHash!: string | null;

  @Column({ name: 'first_name', length: 100 })
  firstName!: string;

  @Column({ name: 'last_name', length: 100 })
  lastName!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone!: string | null;

  @Column({ type: 'varchar', length: 20, default: UserRole.Student })
  role!: UserRole;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ name: 'email_verified', default: false })
  emailVerified!: boolean;

  @Column({ name: 'avatar_url', type: 'varchar', length: 500, nullable: true })
  avatarUrl!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => TenantEntity, (tenant) => tenant.users, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant!: TenantEntity;

  @OneToMany(() => SessionEntity, (session) => session.instructor)
  sessions!: SessionEntity[];

  @OneToMany(() => BookingEntity, (booking) => booking.user)
  bookings!: BookingEntity[];

  @OneToMany(() => StudentPackageEntity, (studentPackage) => studentPackage.user)
  studentPackages!: StudentPackageEntity[];

  @OneToMany(() => PaymentEntity, (payment) => payment.user)
  payments!: PaymentEntity[];

  @OneToMany(() => RefreshTokenEntity, (refreshToken) => refreshToken.user)
  refreshTokens!: RefreshTokenEntity[];
}
