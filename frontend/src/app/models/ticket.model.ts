import { Address } from './address.model';
import { PaymentMethod } from '../enums/payment-method';
import { TicketStatus } from '../enums/ticket-status';
import { TicketType } from '../enums/ticket-type';
import { PriceRange } from './price-range.model';

export interface Ticket {
    id: number;
    code: string;
    type: TicketType;
    title: string;
    description: string;

    categoryId: number;

    address: Address;
    createdAt: string;
    proposals: number;
    priceRange: PriceRange;
    paymentMethods: PaymentMethod[];
    availableDays: string[];
    availableHours: string[];
    status: TicketStatus;
}