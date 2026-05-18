import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'crypto';
import { Repository } from 'typeorm';
import { SlugAvailabilityDto, TenantResponseDto, UploadSignatureDto } from './dto/tenant-response.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { TenantEntity } from './tenant.entity';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(TenantEntity)
    private readonly tenantsRepository: Repository<TenantEntity>,
    private readonly config: ConfigService,
  ) {}

  async getCurrentTenant(tenantId: string): Promise<TenantResponseDto> {
    const tenant = await this.findTenantOrThrow(tenantId);
    return this.toTenantResponse(tenant);
  }

  async updateCurrentTenant(tenantId: string, dto: UpdateTenantDto): Promise<TenantResponseDto> {
    const tenant = await this.findTenantOrThrow(tenantId);

    if (dto.slug && dto.slug !== tenant.slug) {
      const slug = this.slugify(dto.slug);
      const exists = await this.tenantsRepository.exists({ where: { slug } });

      if (exists) {
        throw new ConflictException('This studio URL is already taken');
      }

      tenant.slug = slug;
    }

    if (dto.name !== undefined) tenant.name = dto.name.trim();
    if (dto.studioType !== undefined) tenant.studioType = dto.studioType;
    if (dto.description !== undefined) tenant.description = dto.description.trim() || null;
    if (dto.address !== undefined) tenant.address = dto.address.trim() || null;
    if (dto.phone !== undefined) tenant.phone = dto.phone.trim() || null;
    if (dto.instagram !== undefined) tenant.instagram = dto.instagram.trim() || null;
    if (dto.coverImageUrl !== undefined) tenant.coverImageUrl = dto.coverImageUrl.trim() || null;
    if (dto.businessHours !== undefined) tenant.businessHours = this.validateBusinessHours(dto.businessHours);

    if (dto.completeOnboarding) {
      tenant.onboardingCompletedAt = new Date();
    }

    return this.toTenantResponse(await this.tenantsRepository.save(tenant));
  }

  async checkSlug(rawSlug: string): Promise<SlugAvailabilityDto> {
    const slug = this.slugify(rawSlug);
    const available = !(await this.tenantsRepository.exists({ where: { slug } }));

    return {
      slug,
      available,
      suggestion: available ? slug : await this.findAvailableSlug(slug),
    };
  }

  getUploadSignature(): UploadSignatureDto {
    const cloudName = this.config.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.config.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.config.get<string>('CLOUDINARY_API_SECRET');
    const folder = this.config.get<string>('CLOUDINARY_FOLDER') ?? 'flowi/studios';

    if (!cloudName || !apiKey || !apiSecret) {
      return { enabled: false };
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const signature = createHash('sha1')
      .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
      .digest('hex');

    return {
      enabled: true,
      cloudName,
      apiKey,
      timestamp,
      signature,
      folder,
    };
  }

  private async findTenantOrThrow(tenantId: string): Promise<TenantEntity> {
    const tenant = await this.tenantsRepository.findOne({
      where: { id: tenantId, isActive: true },
    });

    if (!tenant) {
      throw new NotFoundException('Studio not found');
    }

    return tenant;
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

  private validateBusinessHours(
    businessHours: Record<string, { enabled: boolean; opens?: string; closes?: string }>,
  ): Record<string, { enabled: boolean; opens?: string; closes?: string }> {
    const validDays = new Set([
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
      'sunday',
    ]);
    const validTime = /^([01]\d|2[0-3]):[0-5]\d$/;

    for (const [day, value] of Object.entries(businessHours)) {
      if (!validDays.has(day)) {
        throw new BadRequestException(`Invalid business day: ${day}`);
      }

      if (typeof value.enabled !== 'boolean') {
        throw new BadRequestException(`Business day ${day} requires enabled boolean`);
      }

      if (value.enabled && (!value.opens || !value.closes)) {
        throw new BadRequestException(`Business day ${day} requires opens and closes`);
      }

      if ((value.opens && !validTime.test(value.opens)) || (value.closes && !validTime.test(value.closes))) {
        throw new BadRequestException(`Business day ${day} has invalid time format`);
      }
    }

    return businessHours;
  }

  private toTenantResponse(tenant: TenantEntity): TenantResponseDto {
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
      onboardingCompletedAt: tenant.onboardingCompletedAt,
    };
  }
}
