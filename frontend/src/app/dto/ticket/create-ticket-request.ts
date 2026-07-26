import { Address } from '../../models/address.model';

export interface CreateTicketRequest {
  id?:number;
  title: string;
  description: string;
  priceMin?: number;
  priceMax?: number;
  serviceDate: string;
  categoryId: number;
  address: Omit<Address, 'id'>;
  paymentMethods?: string[];
  availableDays?: string[];
  availableHours?: string[];
}