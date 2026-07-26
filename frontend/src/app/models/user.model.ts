import { UserRole } from "../enums/user-role";

export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  phone?: string;
  nickname?: string;
  cpf: string;
  rating?: number;
  isProvider: boolean;             
  createdServicesCount?: number;      

  serviceStartDate?: string;          
  completedServicesCount?: number;
  urgencyId?: number;
  categoryIds?: number[];
  city?: string;
  state?: string;
}