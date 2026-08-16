// models/user.model.ts
export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  phone: string;
  nickname?: string;
  cpf: string;
  rating?: number;
  provider: boolean;
  availableForUrgency?: boolean;
  createdServicesCount?: number;
  serviceStartDate?: string;
  completedServicesCount?: number;
  categoryIds?: number[];
  city: string;
  state: string;
}