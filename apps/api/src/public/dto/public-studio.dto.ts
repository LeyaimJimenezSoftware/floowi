import { SessionStatus } from '../../common/enums/session-status.enum';

export class PublicPackageDto {
  id!: string;
  name!: string;
  description!: string | null;
  totalClasses!: number;
  validityDays!: number;
  price!: string;
  currency!: string;
}

export class PublicSessionDto {
  id!: string;
  title!: string;
  description!: string | null;
  startTime!: Date;
  endTime!: Date;
  maxCapacity!: number;
  currentBookings!: number;
  location!: string | null;
  status!: SessionStatus;
}

export class PublicStudioDto {
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
  packages!: PublicPackageDto[];
  upcomingSessions!: PublicSessionDto[];
}
