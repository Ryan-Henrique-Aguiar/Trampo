import { User } from '../../models/user.model';

export type UserDto = Omit<User, 'password'>;

export interface AuthResponseDto {
  token: string;
  user: UserDto;
  provider: boolean;
}