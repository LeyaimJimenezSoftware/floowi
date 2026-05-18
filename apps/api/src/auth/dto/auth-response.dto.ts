import { UserRole } from '../../common/enums/user-role.enum';

export class AuthUserDto {
  id!: string;
  tenantId!: string;
  email!: string;
  firstName!: string;
  lastName!: string;
  role!: UserRole;
}

export class AuthResponseDto {
  accessToken!: string;
  refreshToken!: string;
  user!: AuthUserDto;
}
