import { Controller, Get, Param, Patch, Post, Body, UseGuards } from '@nestjs/common';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { TenantGuard } from '../common/guards/tenant.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SlugAvailabilityDto, TenantResponseDto, UploadSignatureDto } from './dto/tenant-response.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { TenantsService } from './tenants.service';

@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get('check-slug/:slug')
  checkSlug(@Param('slug') slug: string): Promise<SlugAvailabilityDto> {
    return this.tenantsService.checkSlug(slug);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, TenantGuard)
  me(@CurrentTenant() tenantId: string): Promise<TenantResponseDto> {
    return this.tenantsService.getCurrentTenant(tenantId);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles(UserRole.Owner)
  updateMe(
    @CurrentTenant() tenantId: string,
    @Body() dto: UpdateTenantDto,
  ): Promise<TenantResponseDto> {
    return this.tenantsService.updateCurrentTenant(tenantId, dto);
  }

  @Post('upload-signature')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles(UserRole.Owner)
  uploadSignature(): UploadSignatureDto {
    return this.tenantsService.getUploadSignature();
  }
}
