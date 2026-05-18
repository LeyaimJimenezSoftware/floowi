export type AuthUser = {
  id: string;
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'owner' | 'instructor' | 'student';
};

export type AuthState = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

const storageKey = 'flowi.auth';

export function getStoredAuth(): AuthState | null {
  const raw = localStorage.getItem(storageKey);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthState;
  } catch {
    localStorage.removeItem(storageKey);
    return null;
  }
}

export function storeAuth(auth: AuthState) {
  localStorage.setItem(storageKey, JSON.stringify(auth));
}

export function clearAuth() {
  localStorage.removeItem(storageKey);
}
