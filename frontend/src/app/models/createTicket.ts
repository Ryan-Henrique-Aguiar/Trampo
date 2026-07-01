import { PaymentMethod } from "../enums/payment-method";
import { PriceRange } from "./price-range.model";
import { TicketType } from "../enums/ticket-type";
import { Address } from "./address.model";

export interface CreateTicket {
    type: TicketType;
    title: string;
    description: string;
    categoryId: number;

    address: Address;

    priceRange: PriceRange;

    paymentMethods: PaymentMethod[];

    availableDays: string[];

    availableHours: string[];
}