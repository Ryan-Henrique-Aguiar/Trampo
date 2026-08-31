import { Address } from '../../models/address.model';

export interface CreateTicketRequest {
  title: string;
  description: string;
  priceMax: number;
  serviceDate?: string;
  categoryId: number;
  address: Omit<Address, 'id'>;
  paymentMethods?: string[];
  availableDays?: string[];
  availableHours?: string[];
}
