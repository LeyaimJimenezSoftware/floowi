import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { UserRole } from '../common/enums/user-role.enum';
import { TenantEntity } from '../tenants/tenant.entity';
import { UserEntity } from '../users/user.entity';
import { AuthService } from './auth.service';
import { RefreshTokenEntity } from './refresh-token.entity';

type TenantRepositoryStub = {
  exists?: jest.Mock;
  findOne?: jest.Mock;
  manager?: {
    transaction: jest.Mock;
  };
};

type UserRepositoryStub = {
  create?: jest.Mock;
  save?: jest.Mock;
  findOne?: jest.Mock;
  createQueryBuilder?: jest.Mock;
};

type RefreshTokenRepositoryStub = {
  create?: jest.Mock;
  save?: jest.Mock;
  findOne?: jest.Mock;
  delete?: jest.Mock;
};

describe('AuthService', () => {
  const config = {
    getOrThrow: jest.fn((key: string) => {
      const values: Record<string, string> = {
        JWT_ACCESS_SECRET: 'access_secret_with_more_than_32_chars',
        JWT_REFRESH_SECRET: 'refresh_secret_with_more_than_32_chars',
        JWT_ACCESS_EXPIRES_IN: '15m',
        JWT_REFRESH_EXPIRES_IN: '30d',
        BCRYPT_SALT_ROUNDS: '12',
      };

      return values[key];
    }),
  } as unknown as ConfigService;

  const jwtService = {
    signAsync: jest.fn((_payload: object, options: { secret: string }) =>
      Promise.resolve(options.secret.startsWith('access') ? 'access-token' : 'refresh-token'),
    ),
    verifyAsync: jest.fn(() => Promise.resolve({
      sub: 'user-1',
      tenantId: 'tenant-1',
      role: UserRole.Owner,
      email: 'owner@flowi.test',
    })),
  } as unknown as JwtService;

  let tenantsRepository: TenantRepositoryStub;
  let usersRepository: UserRepositoryStub;
  let refreshTokensRepository: RefreshTokenRepositoryStub;
  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();

    const tenant = { id: 'tenant-1', slug: 'sofia-pilates', name: 'Sofia Pilates' };
    const user = {
      id: 'user-1',
      tenantId: 'tenant-1',
      email: 'owner@flowi.test',
      firstName: 'Sofia',
      lastName: 'Lopez',
      role: UserRole.Owner,
      passwordHash: 'hash',
    };

    const manager = {
      create: jest.fn((_entity: object, value: object) => value),
      save: jest.fn((entity: object, value: object) =>
        Promise.resolve(entity === TenantEntity ? tenant : value),
      ),
    };

    tenantsRepository = {
      exists: jest.fn(() => Promise.resolve(false)),
      findOne: jest.fn(),
      manager: {
        transaction: jest.fn((callback: (transactionManager: typeof manager) => unknown) =>
          Promise.resolve(callback(manager)),
        ),
      },
    };

    usersRepository = {
      create: jest.fn(() => user as UserEntity),
      save: jest.fn((value: UserEntity) => Promise.resolve(value)),
      findOne: jest.fn(() => Promise.resolve(user as UserEntity)),
    };

    refreshTokensRepository = {
      create: jest.fn((value: object) => value as RefreshTokenEntity),
      save: jest.fn((value: RefreshTokenEntity) => Promise.resolve(value)),
      findOne: jest.fn(() =>
        Promise.resolve({
          id: 'refresh-1',
          userId: 'user-1',
          tokenHash: 'hash',
          expiresAt: new Date(Date.now() + 60_000),
        }),
      ),
      delete: jest.fn(() => Promise.resolve({ affected: 1, raw: [] })),
    };

    service = new AuthService(
      tenantsRepository as unknown as Repository<TenantEntity>,
      usersRepository as unknown as Repository<UserEntity>,
      refreshTokensRepository as unknown as Repository<RefreshTokenEntity>,
      config,
      jwtService,
    );
  });

  it('creates an owner tenant and user in a transaction', async () => {
    const response = await service.registerOwner({
      email: 'OWNER@FLOWI.TEST',
      password: 'super-secret',
      firstName: 'Sofia',
      lastName: 'Lopez',
      studioName: 'Sofia Pilates',
    });

    expect(response.accessToken).toBe('access-token');
    expect(response.refreshToken).toBe('refresh-token');
    expect(response.user.email).toBe('owner@flowi.test');
    expect(tenantsRepository.manager?.transaction).toHaveBeenCalledTimes(1);
    expect(refreshTokensRepository.save).toHaveBeenCalledTimes(1);
  });

  it('requires tenantSlug when an email belongs to multiple active tenants', async () => {
    const query = {
      innerJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn(() =>
        Promise.resolve([
          { id: 'user-1', email: 'owner@flowi.test' },
          { id: 'user-2', email: 'owner@flowi.test' },
        ]),
      ),
    };
    usersRepository.createQueryBuilder = jest.fn(() => query);

    await expect(
      service.login({ email: 'owner@flowi.test', password: 'super-secret' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rotates refresh tokens after a successful refresh', async () => {
    const response = await service.refresh('refresh-token');

    expect(response.accessToken).toBe('access-token');
    const jwtServiceMock = jwtService as unknown as { verifyAsync: jest.Mock };
    expect(jwtServiceMock.verifyAsync).toHaveBeenCalledWith('refresh-token', {
      secret: 'refresh_secret_with_more_than_32_chars',
    });
    expect(refreshTokensRepository.delete).toHaveBeenCalledWith({ id: 'refresh-1' });
    expect(refreshTokensRepository.save).toHaveBeenCalledTimes(1);
  });
});
