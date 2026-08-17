import { TicketStatus } from '../enums/ticket-status';
import { Address } from './address.model';

export interface Ticket {
    id: number;
    code: string;
    title: string;
    description: string;
    createdAt: string;
    priceMax?: number;
    serviceDate?: string;
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
    code: string;
    title: string;
    description: string;
    createdAt: string;
    userId: number;
    status: TicketStatus
    categoryId: number;
    providerId: number;
    address: Address;
    serviceDate?: string;
}