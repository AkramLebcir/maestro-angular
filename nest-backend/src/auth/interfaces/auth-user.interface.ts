import { UserRole } from '../../users/entities/user.entity';

export interface AuthUser {
  id: number;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  allowedModules?: string[];
  isActive: boolean;
  sessionId?: string;
}

export interface JwtPayload {
  sub: number;
  email: string;
  role: UserRole;
  modules?: string[];
  isActive: boolean;
  firstName?: string;
  lastName?: string;
   sessionId: string;
}


