import { UrgencyStatus } from '../enums/urgency-status';

export interface Urgency {
  id: number;
  status: UrgencyStatus;      // controlado pelo profissional (liga/desliga)
  priceRange: number;
  minimumRate: number;
  completedServicesCount: number;
  professionalId: number;     // dono da configuração de urgência
}