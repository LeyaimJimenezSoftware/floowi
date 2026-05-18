import {
  IsBoolean,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { BusinessDayDto } from './business-hours.dto';

export class UpdateTenantDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  @Matches(/^[a-z0-9-]+$/)
  slug?: string;

  @IsOptional()
  @IsString()
  @IsIn(['pilates', 'yoga', 'gym', 'wellness', 'other'])
  studioType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(280)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  instagram?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(500)
  coverImageUrl?: string;

  @IsOptional()
  @IsObject()
  businessHours?: Record<string, BusinessDayDto>;

  @IsOptional()
  @IsBoolean()
  completeOnboarding?: boolean;
}
