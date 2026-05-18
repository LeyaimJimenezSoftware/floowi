import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { StringValue } from 'ms';
import { Repository } from 'typeorm';
import { UserRole } from '../common/enums/user-role.enum';
import { TenantEntity } from '../tenants/tenant.entity';
import { UserEntity } from '../users/user.entity';
import { AuthResponseDto, AuthUserDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterOwnerDto } from './dto/register-owner.dto';
import { RegisterStudentDto } from './dto/register-student.dto';
import { JwtPayload } from './jwt-payload.interface';
import { RefreshTokenEntity } from './refresh-token.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(TenantEntity)
    private readonly tenantsRepository: Repository<TenantEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(RefreshTokenEntity)
    private readonly refreshTokensRepository: Repository<RefreshTokenEntity>,
    private readonly config: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async registerOwner(dto: RegisterOwnerDto): Promise<AuthResponseDto> {
    const email = this.normalizeEmail(dto.email);
    const passwordHash = await this.hashPassword(dto.password);
    const slug = await this.findAvailableSlug(dto.slug ?? dto.studioName);

    const { tenant, user } = await this.tenantsRepository.manager.transaction(async (manager) => {
      const tenant = manager.create(TenantEntity, {
        slug,
        name: dto.studioName.trim(),
      });
      const savedTenant = await manager.save(TenantEntity, tenant);

      const user = manager.create(UserEntity, {
        tenantId: savedTenant.id,
        email,
        passwordHash,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        role: UserRole.Owner,
        emailVerified: false,
      });
      const savedUser = await manager.save(UserEntity, user);

      return { tenant: savedTenant, user: savedUser };
    });

    return this.createAuthResponse(user, tenant.id);
  }

  async registerStudent(dto: RegisterStudentDto): Promise<AuthResponseDto> {
    const email = this.normalizeEmail(dto.email);
    const tenant = await this.tenantsRepository.findOne({
      where: { slug: dto.tenantSlug, isActive: true },
    });

    if (!tenant) {
      throw new NotFoundException('Studio not found');
    }

    const existingUser = await this.usersRepository.findOne({
      where: { tenantId: tenant.id, email },
    });

    if (existingUser) {
      throw new ConflictException('A user with this email already exists in this studio');
    }

    const passwordHash = await this.hashPassword(dto.password);
    const user = this.usersRepository.create({
      tenantId: tenant.id,
      email,
      passwordHash,
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      phone: dto.phone?.trim() ?? null,
      role: UserRole.Student,
      emailVerified: false,
    });

    return this.createAuthResponse(await this.usersRepository.save(user), tenant.id);
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const email = this.normalizeEmail(dto.email);
    const query = this.usersRepository
      .createQueryBuilder('user')
      .innerJoinAndSelect('user.tenant', 'tenant')
      .where('LOWER(user.email) = :email', { email })
      .andWhere('user.is_active = true')
      .andWhere('tenant.is_active = true');

    if (dto.tenantSlug) {
      query.andWhere('tenant.slug = :tenantSlug', { tenantSlug: dto.tenantSlug });
    }

    const users = await query.getMany();

    if (users.length === 0) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!dto.tenantSlug && users.length > 1) {
      throw new UnauthorizedException('Studio is required for this email');
    }

    const user = users[0];

    if (!user.passwordHash || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.createAuthResponse(user, user.tenantId);
  }

  async refresh(refreshToken: string): Promise<AuthResponseDto> {
    const payload = await this.verifyRefreshToken(refreshToken);
    const tokenHash = this.hashRefreshToken(refreshToken);
    const storedToken = await this.refreshTokensRepository.findOne({
      where: { tokenHash, userId: payload.sub },
    });

    if (!storedToken || storedToken.expiresAt <= new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.usersRepository.findOne({
      where: { id: payload.sub, tenantId: payload.tenantId, isActive: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.refreshTokensRepository.delete({ id: storedToken.id });
    return this.createAuthResponse(user, user.tenantId);
  }

  async logout(refreshToken: string): Promise<{ success: true }> {
    await this.refreshTokensRepository.delete({ tokenHash: this.hashRefreshToken(refreshToken) });
    return { success: true };
  }

  private async createAuthResponse(user: UserEntity, tenantId: string): Promise<AuthResponseDto> {
    const payload: JwtPayload = {
      sub: user.id,
      tenantId,
      role: user.role,
      email: user.email,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.getJwtExpiresIn('JWT_ACCESS_EXPIRES_IN'),
      }),
      this.issueRefreshToken(payload),
    ]);

    return {
      accessToken,
      refreshToken,
      user: this.toAuthUser(user, tenantId),
    };
  }

  private async issueRefreshToken(payload: JwtPayload): Promise<string> {
    const tokenId = randomBytes(32).toString('hex');
    const refreshToken = await this.jwtService.signAsync({ ...payload, tokenId }, {
      secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.getJwtExpiresIn('JWT_REFRESH_EXPIRES_IN'),
    });

    await this.refreshTokensRepository.save(
      this.refreshTokensRepository.create({
        userId: payload.sub,
        tokenHash: this.hashRefreshToken(refreshToken),
        expiresAt: this.getRefreshTokenExpiry(),
      }),
    );

    return refreshToken;
  }

  private async verifyRefreshToken(refreshToken: string): Promise<JwtPayload> {
    try {
      return await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private hashRefreshToken(refreshToken: string): string {
    return createHash('sha256').update(refreshToken).digest('hex');
  }

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = Number(this.config.getOrThrow<string>('BCRYPT_SALT_ROUNDS'));
    return bcrypt.hash(password, saltRounds);
  }

  private getRefreshTokenExpiry(): Date {
    const expiresIn = this.config.getOrThrow<string>('JWT_REFRESH_EXPIRES_IN');
    const match = expiresIn.match(/^(\d+)([mhd])$/);

    if (!match) {
      throw new Error('JWT_REFRESH_EXPIRES_IN must use m, h, or d suffix');
    }

    const amount = Number(match[1]);
    const unit = match[2];
    const multipliers = {
      m: 60_000,
      h: 3_600_000,
      d: 86_400_000,
    };

    return new Date(Date.now() + amount * multipliers[unit as keyof typeof multipliers]);
  }

  private getJwtExpiresIn(key: 'JWT_ACCESS_EXPIRES_IN' | 'JWT_REFRESH_EXPIRES_IN'): StringValue {
    return this.config.getOrThrow<string>(key) as StringValue;
  }

  private async findAvailableSlug(value: string): Promise<string> {
    const baseSlug = this.slugify(value);
    let candidate = baseSlug;
    let suffix = 2;

    while (await this.tenantsRepository.exists({ where: { slug: candidate } })) {
      candidate = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    return candidate;
  }

  private slugify(value: string): string {
    const slug = value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 50);

    return slug.length >= 3 ? slug : `studio-${slug || 'flowi'}`;
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private toAuthUser(user: UserEntity, tenantId: string): AuthUserDto {
    return {
      id: user.id,
      tenantId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    };
  }
}
