import { PaymentMethod } from "../enums/payment-method";
import { PriceRange } from "./price-range.model";
import { TicketType } from "../enums/ticket-type";
import { Address } from "./address.model";

export interface CreateTicket {
    title: string;
    description: string;
    userId: number;
    categoryId: number;
    address: Address;
    priceRange: PriceRange;
    paymentMethods: PaymentMethod[];
    availableDays: string[];
    availableHours: string[];
    type: TicketType;
}