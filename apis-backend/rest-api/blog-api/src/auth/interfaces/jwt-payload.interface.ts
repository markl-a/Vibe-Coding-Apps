import { UserRole } from '../../users/user.entity';

export interface JwtPayload {
  username: string;
  sub: string;
  role: UserRole;
}

export interface ValidatedUser {
  userId: string;
  username: string;
  role: UserRole;
}
