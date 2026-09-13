import { UserDto } from '../auth/auth-response';

export interface UpdateProfileRequest {
  name: string;
  email: string;
  cpf: string;
  phone: string;
}

export interface UpdateLocationRequest {
  state: string;
  city: string;
}

export interface UpdatePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfileResponse {
  user: UserDto;
  token: string;
}
