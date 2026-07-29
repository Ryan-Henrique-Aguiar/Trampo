

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
  isAvailableForUrgency?: boolean;   // <-- substitui urgencyId
  categoryIds?: number[];
  city?: string;
  state?: string;
}