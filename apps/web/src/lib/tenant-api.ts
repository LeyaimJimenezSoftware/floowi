import { apiClient } from './api-client';
import { AuthState } from '@/state/auth';

export type BusinessDay = {
  enabled: boolean;
  opens?: string;
  closes?: string;
};

export type Tenant = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  studioType: string | null;
  coverImageUrl: string | null;
  address: string | null;
  phone: string | null;
  instagram: string | null;
  themeColor: string;
  typography: string;
  timezone: string;
  businessHours: Record<string, BusinessDay> | null;
  onboardingCompletedAt: string | null;
};

export type TenantUpdate = Partial<
  Pick<
    Tenant,
    | 'name'
    | 'slug'
    | 'studioType'
    | 'description'
    | 'address'
    | 'phone'
    | 'instagram'
    | 'coverImageUrl'
    | 'businessHours'
  >
> & {
  completeOnboarding?: boolean;
};

export async function registerOwner(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  studioName: string;
  slug: string;
}) {
  const { data } = await apiClient.post<AuthState>('/auth/register', input);
  return data;
}

export async function getMyTenant() {
  const { data } = await apiClient.get<Tenant>('/tenants/me');
  return data;
}

export async function updateMyTenant(input: TenantUpdate) {
  const { data } = await apiClient.patch<Tenant>('/tenants/me', input);
  return data;
}

export async function checkSlug(slug: string) {
  const { data } = await apiClient.get<{ slug: string; available: boolean; suggestion: string }>(
    `/tenants/check-slug/${slug}`,
  );
  return data;
}

export async function getUploadSignature() {
  const { data } = await apiClient.post<{ enabled: boolean }>('/tenants/upload-signature');
  return data;
}
