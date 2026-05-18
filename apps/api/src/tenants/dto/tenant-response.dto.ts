export class SlugAvailabilityDto {
  slug!: string;
  available!: boolean;
  suggestion!: string;
}

export class UploadSignatureDto {
  enabled!: boolean;
  cloudName?: string;
  apiKey?: string;
  timestamp?: number;
  signature?: string;
  folder?: string;
}

export class TenantResponseDto {
  id!: string;
  slug!: string;
  name!: string;
  description!: string | null;
  studioType!: string | null;
  coverImageUrl!: string | null;
  address!: string | null;
  phone!: string | null;
  instagram!: string | null;
  themeColor!: string;
  typography!: string;
  timezone!: string;
  businessHours!: Record<string, unknown> | null;
  onboardingCompletedAt!: Date | null;
}
