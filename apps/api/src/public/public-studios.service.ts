import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { SessionStatus } from '../common/enums/session-status.enum';
import { PackageEntity } from '../packages/package.entity';
import { SessionEntity } from '../sessions/session.entity';
import { TenantEntity } from '../tenants/tenant.entity';
import { PublicPackageDto, PublicSessionDto, PublicStudioDto } from './dto/public-studio.dto';

@Injectable()
export class PublicStudiosService {
  constructor(
    @InjectRepository(TenantEntity)
    private readonly tenantsRepository: Repository<TenantEntity>,
    @InjectRepository(PackageEntity)
    private readonly packagesRepository: Repository<PackageEntity>,
    @InjectRepository(SessionEntity)
    private readonly sessionsRepository: Repository<SessionEntity>,
  ) {}

  async getStudioBySlug(slug: string): Promise<PublicStudioDto> {
    const tenant = await this.findActiveTenant(slug);
    const now = new Date();
    const inSevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [packages, upcomingSessions] = await Promise.all([
      this.packagesRepository.find({
        where: { tenantId: tenant.id, isActive: true },
        order: { sortOrder: 'ASC', createdAt: 'ASC' },
      }),
      this.sessionsRepository.find({
        where: {
          tenantId: tenant.id,
          status: SessionStatus.Scheduled,
          startTime: Between(now, inSevenDays),
        },
        order: { startTime: 'ASC' },
      }),
    ]);

    return {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      description: tenant.description,
      studioType: tenant.studioType,
      coverImageUrl: tenant.coverImageUrl,
      address: tenant.address,
      phone: tenant.phone,
      instagram: tenant.instagram,
      themeColor: tenant.themeColor,
      typography: tenant.typography,
      timezone: tenant.timezone,
      businessHours: tenant.businessHours,
      packages: packages.map((packageEntity) => this.toPublicPackage(packageEntity)),
      upcomingSessions: upcomingSessions.map((session) => this.toPublicSession(session)),
    };
  }

  async getStudioSessionsByDate(slug: string, date?: string): Promise<PublicSessionDto[]> {
    const tenant = await this.findActiveTenant(slug);
    const targetDate = date ? new Date(`${date}T00:00:00`) : new Date();

    if (Number.isNaN(targetDate.getTime())) {
      return [];
    }

    const start = new Date(targetDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(targetDate);
    end.setHours(23, 59, 59, 999);

    const sessions = await this.sessionsRepository.find({
      where: {
        tenantId: tenant.id,
        status: SessionStatus.Scheduled,
        startTime: MoreThanOrEqual(start),
        endTime: LessThanOrEqual(end),
      },
      order: { startTime: 'ASC' },
    });

    return sessions.map((session) => this.toPublicSession(session));
  }

  private async findActiveTenant(slug: string): Promise<TenantEntity> {
    const tenant = await this.tenantsRepository.findOne({
      where: { slug, isActive: true },
    });

    if (!tenant || !tenant.onboardingCompletedAt) {
      throw new NotFoundException('Studio not found');
    }

    return tenant;
  }

  private toPublicPackage(packageEntity: PackageEntity): PublicPackageDto {
    return {
      id: packageEntity.id,
      name: packageEntity.name,
      description: packageEntity.description,
      totalClasses: packageEntity.totalClasses,
      validityDays: packageEntity.validityDays,
      price: packageEntity.price,
      currency: packageEntity.currency,
    };
  }

  private toPublicSession(session: SessionEntity): PublicSessionDto {
    return {
      id: session.id,
      title: session.title,
      description: session.description,
      startTime: session.startTime,
      endTime: session.endTime,
      maxCapacity: session.maxCapacity,
      currentBookings: session.currentBookings,
      location: session.location,
      status: session.status,
    };
  }
}
