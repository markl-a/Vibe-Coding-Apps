import { User } from '../../users/user.entity';

export interface AuthResponse {
  access_token: string;
  user: Omit<User, 'password'>;
}
