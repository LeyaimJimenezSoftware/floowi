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
import { PaymentEntity } from '../payments/payment.entity';
import { StudentPackageEntity } from '../student-packages/student-package.entity';
import { TenantEntity } from '../tenants/tenant.entity';

@Entity({ name: 'packages' })
@Index('idx_packages_tenant_active', ['tenantId', 'isActive'])
export class PackageEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'total_classes', type: 'integer' })
  totalClasses!: number;

  @Column({ name: 'validity_days', type: 'integer' })
  validityDays!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price!: string;

  @Column({ length: 3, default: 'MXN' })
  currency!: string;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ name: 'sort_order', type: 'integer', default: 0 })
  sortOrder!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => TenantEntity, (tenant) => tenant.packages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant!: TenantEntity;

  @OneToMany(() => StudentPackageEntity, (studentPackage) => studentPackage.package)
  studentPackages!: StudentPackageEntity[];

  @OneToMany(() => PaymentEntity, (payment) => payment.package)
  payments!: PaymentEntity[];
}
