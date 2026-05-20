import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { SessionStatus } from '../common/enums/session-status.enum';
import { PackageEntity } from '../packages/package.entity';
import { SessionEntity } from '../sessions/session.entity';
import { TenantEntity } from '../tenants/tenant.entity';
import { PublicStudiosService } from './public-studios.service';

type RepositoryStub<T> = {
  findOne?: jest.Mock;
  find?: jest.Mock<Promise<T[]>, [unknown?]>;
  entity?: T;
};

describe('PublicStudiosService', () => {
  const tenant = {
    id: 'tenant-1',
    slug: 'sofia-pilates',
    name: 'Sofia Pilates',
    description: 'Pilates boutique para grupos pequenos.',
    studioType: 'pilates',
    coverImageUrl: 'https://images.example/cover.jpg',
    address: 'Av. Reforma 123',
    phone: '+525512345678',
    instagram: 'sofiapilates',
    themeColor: '#4A7C6F',
    typography: 'DM Sans',
    timezone: 'America/Mexico_City',
    businessHours: { monday: { enabled: true, opens: '07:00', closes: '19:00' } },
    onboardingCompletedAt: new Date('2026-05-18T10:00:00Z'),
    isActive: true,
  } as unknown as TenantEntity;

  const activePackage = {
    id: 'package-1',
    name: 'Mensual',
    description: '10 clases',
    totalClasses: 10,
    validityDays: 30,
    price: '950.00',
    currency: 'MXN',
  } as PackageEntity;

  const session = {
    id: 'session-1',
    title: 'Mat Pilates',
    description: null,
    startTime: new Date('2026-05-19T14:00:00Z'),
    endTime: new Date('2026-05-19T15:00:00Z'),
    maxCapacity: 8,
    currentBookings: 3,
    location: 'Sala A',
    status: SessionStatus.Scheduled,
  } as SessionEntity;

  let tenantsRepository: RepositoryStub<TenantEntity>;
  let packagesRepository: RepositoryStub<PackageEntity>;
  let sessionsRepository: RepositoryStub<SessionEntity>;
  let service: PublicStudiosService;

  beforeEach(() => {
    tenantsRepository = {
      findOne: jest.fn(() => Promise.resolve(tenant)),
    };
    packagesRepository = {
      find: jest.fn(() => Promise.resolve([activePackage])),
    };
    sessionsRepository = {
      find: jest.fn(() => Promise.resolve([session])),
    };

    service = new PublicStudiosService(
      tenantsRepository as unknown as Repository<TenantEntity>,
      packagesRepository as unknown as Repository<PackageEntity>,
      sessionsRepository as unknown as Repository<SessionEntity>,
    );
  });

  it('returns a public studio with active packages and upcoming sessions', async () => {
    const result = await service.getStudioBySlug('sofia-pilates');

    expect(result.slug).toBe('sofia-pilates');
    expect(result.packages).toHaveLength(1);
    expect(result.packages[0].name).toBe('Mensual');
    expect(result.upcomingSessions).toHaveLength(1);
    expect(result.upcomingSessions[0].currentBookings).toBe(3);
    expect(packagesRepository.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId: 'tenant-1', isActive: true },
        order: { sortOrder: 'ASC', createdAt: 'ASC' },
      }),
    );
  });

  it('throws not found when the studio does not exist', async () => {
    tenantsRepository.findOne = jest.fn(() => Promise.resolve(null));

    await expect(service.getStudioBySlug('missing')).rejects.toThrow(NotFoundException);
  });

  it('throws not found when onboarding is not complete', async () => {
    tenantsRepository.findOne = jest.fn(() =>
      Promise.resolve({ ...tenant, onboardingCompletedAt: null } as TenantEntity),
    );

    await expect(service.getStudioBySlug('sofia-pilates')).rejects.toThrow(NotFoundException);
  });

  it('returns public sessions for a requested date', async () => {
    const result = await service.getStudioSessionsByDate('sofia-pilates', '2026-05-19');

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Mat Pilates');
    const findMock = sessionsRepository.find as jest.Mock<Promise<SessionEntity[]>, [unknown?]>;
    const firstCall = findMock.mock.calls.at(0);
    const findArgs = firstCall?.[0] as {
      where: { tenantId: string; status: SessionStatus };
      order: { startTime: string };
    };

    expect(findArgs.where.tenantId).toBe('tenant-1');
    expect(findArgs.where.status).toBe(SessionStatus.Scheduled);
    expect(findArgs.order).toEqual({ startTime: 'ASC' });
  });
});
