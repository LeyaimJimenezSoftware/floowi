import { RefreshTokenEntity } from '../auth/refresh-token.entity';
import { BookingEntity } from '../bookings/booking.entity';
import { PackageEntity } from '../packages/package.entity';
import { PaymentEntity } from '../payments/payment.entity';
import { SessionEntity } from '../sessions/session.entity';
import { StudentPackageEntity } from '../student-packages/student-package.entity';
import { TenantEntity } from '../tenants/tenant.entity';
import { UserEntity } from '../users/user.entity';

export const databaseEntities = [
  TenantEntity,
  UserEntity,
  PackageEntity,
  SessionEntity,
  PaymentEntity,
  StudentPackageEntity,
  BookingEntity,
  RefreshTokenEntity,
];
