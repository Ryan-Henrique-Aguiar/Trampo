import { Address } from '../../models/address.model';

export interface UpdateTicketRequest {
  title: string;
  description: string;
  address: Omit<Address, 'id'>;
  priceMax: number;
  paymentMethods: string[];
  availableDays: string[];
  availableHours: string[];
}
