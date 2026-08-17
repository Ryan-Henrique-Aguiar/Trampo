// update-ticket-request.ts
import { Address } from '../../models/address.model';

export interface UpdateTicketRequest {
  title?: string;
  description?: string;
  categoryId?: number;
  address?: Omit<Address, 'id'>;
  priceMax?: number;
  paymentMethods?: string[];
  availableDays?: string[];
  availableHours?: string[];
  proposalsCount?: number;
}