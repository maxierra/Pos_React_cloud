export type UserRole = 'admin' | 'owner' | 'employee';

export type AuthUser = {
  id: string;
  email: string;
  emailConfirmed: boolean;
  role: UserRole | null;
  businessId: string | null;
};

export type AuthResult = {
  ok: true;
  user: AuthUser;
} | {
  ok: false;
  error: string;
};

export function isAdmin(role: UserRole | null): boolean {
  return role === 'admin';
}

export function isOwner(role: UserRole | null): boolean {
  return role === 'owner';
}

export function isEmployee(role: UserRole | null): boolean {
  return role === 'employee';
}

export function canAccessPOS(role: UserRole | null): boolean {
  return role === 'owner' || role === 'employee';
}

export function canAccessAdmin(role: UserRole | null): boolean {
  return role === 'admin';
}