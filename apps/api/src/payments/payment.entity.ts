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
import { PaymentProvider } from '../common/enums/payment-provider.enum';
import { PaymentStatus } from '../common/enums/payment-status.enum';
import { PackageEntity } from '../packages/package.entity';
import { StudentPackageEntity } from '../student-packages/student-package.entity';
import { TenantEntity } from '../tenants/tenant.entity';
import { UserEntity } from '../users/user.entity';

@Entity({ name: 'payments' })
@Index('idx_payments_tenant', ['tenantId', 'createdAt'])
export class PaymentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'package_id', type: 'uuid' })
  packageId!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: string;

  @Column({ length: 3, default: 'MXN' })
  currency!: string;

  @Column({ type: 'varchar', length: 20 })
  provider!: PaymentProvider;

  @Column({ name: 'provider_id', type: 'varchar', length: 255, nullable: true })
  providerId!: string | null;

  @Column({ type: 'varchar', length: 20, default: PaymentStatus.Pending })
  status!: PaymentStatus;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => TenantEntity, (tenant) => tenant.payments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant!: TenantEntity;

  @ManyToOne(() => UserEntity, (user) => user.payments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @ManyToOne(() => PackageEntity, (packageEntity) => packageEntity.payments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'package_id' })
  package!: PackageEntity;

  @OneToMany(() => StudentPackageEntity, (studentPackage) => studentPackage.payment)
  studentPackages!: StudentPackageEntity[];
}
