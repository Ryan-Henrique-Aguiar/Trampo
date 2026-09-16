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
    userName: string;
    userRating: number | null;
    categoryId: number;
    proposalsCount?: number;
    address: Address;
    paymentMethods?: string[];
    availableDays?: string[];
    availableHours?: string[];
}

export interface TicketPage {
    content: Ticket[];
    hasNext: boolean;
}

export interface UrgentTicket {
    id: number;
    code: string;
    title: string;
    description: string;
    createdAt: string;
    status: TicketStatus;
    userId: number;
    categoryId: number;
    providerId: number;
    address: Address;
    serviceDate?: string;
}

export interface UrgentTicketPage {
    content: UrgentTicket[];
    hasNext: boolean;
}

export interface GroupedTickets {
    categoryName: string;
    tickets: Ticket[];
}

export interface TicketImage{
    id: number;
    ticket: Ticket;
    filename: string;
    filepath: string;
    contentType: string;
    fileSize: number;
    createdAt: Date;
}