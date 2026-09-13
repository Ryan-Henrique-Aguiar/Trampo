export interface UserDto {
  id: number;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  rating: number | null;
  provider: boolean;
  availableForUrgency: boolean;
  createdServicesCount: number | null;
  serviceStartDate: string | null;
  completedServicesCount: number | null;
  city: string;
  state: string;
}

export interface AuthResponseDto {
  token: string;
}
