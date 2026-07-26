import { User } from '../../models/user.model';

export interface AuthResponse {
  token: string;
  user: User;
}