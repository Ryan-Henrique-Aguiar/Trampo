import { Address } from '../../models/address.model';

export interface CreateUrgentTicketRequest {
  title: string;
  description: string;
  categoryId: number;
  address: Omit<Address, 'id'>;
  providerId: number;
}

