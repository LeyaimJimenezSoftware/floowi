import { apiClient } from './api-client';
import { BusinessDay } from './tenant-api';

export type PublicPackage = {
  id: string;
  name: string;
  description: string | null;
  totalClasses: number;
  validityDays: number;
  price: string;
  currency: string;
};

export type PublicSession = {
  id: string;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  currentBookings: number;
  location: string | null;
  status: 'scheduled' | 'cancelled' | 'completed';
};

export type PublicStudio = {
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
  packages: PublicPackage[];
  upcomingSessions: PublicSession[];
};

export async function getPublicStudio(slug: string) {
  const { data } = await apiClient.get<PublicStudio>(`/public/studios/${slug}`);
  return data;
}

export async function getPublicStudioSessions(slug: string, date: string) {
  const { data } = await apiClient.get<PublicSession[]>(
    `/public/studios/${slug}/sessions?date=${date}`,
  );
  return data;
}
