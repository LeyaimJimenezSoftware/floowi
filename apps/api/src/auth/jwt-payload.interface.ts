import { UserRole } from '../common/enums/user-role.enum';

export interface JwtPayload {
  sub: string;
  tenantId: string;
  role: UserRole;
  email: string;
}
