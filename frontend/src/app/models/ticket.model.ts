import { TicketStatus } from '../enums/ticket-status';
import { Address } from './address.model';

export interface PriceRange {
  min: number;
  max: number;
}

export interface Ticket {
    id: number;
    code: string;
    title: string;
    description: string;
    createdAt: string;
    priceRange?: PriceRange;
    serviceDate: string;
    status: TicketStatus;
    userId: number;
    categoryId: number;
    proposalsCount?: number;
    address: Address;
    paymentMethods?: string[];
    availableDays?: string[];
    availableHours?: string[];
}

export interface UrgentTicket {
    id: number;
    description: string;
    createdAt: string;
    userId: number;
    categoryId: number;
}