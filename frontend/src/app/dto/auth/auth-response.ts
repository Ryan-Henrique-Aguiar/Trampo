export interface UserDto {
  id: number;
  name: string;
  rating: number | null;
  provider: boolean;
  availableForUrgency: boolean;
  createdServicesCount: number | null;
  serviceStartDate: string | null;
  completedServicesCount: number | null;
  city: string;
  state: string;
  categoryIds?: number[];
}

export interface AuthResponseDto {
  token: string;
}
