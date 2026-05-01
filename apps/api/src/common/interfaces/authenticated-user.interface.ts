import { UserRole } from '../enums/user-role.enum';

export interface AuthenticatedUser {
  sub: string;
  tenantId: string;
  role: UserRole;
  email: string;
}
