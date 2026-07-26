import { Address } from '../../models/address.model';

export interface CreateUrgentTicketRequest {
  description: string;
  categoryId: number;
  address: Omit<Address, 'id'>;
}