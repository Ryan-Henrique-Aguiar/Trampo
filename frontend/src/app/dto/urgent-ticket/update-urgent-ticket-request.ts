import { TicketStatus } from '../../enums/ticket-status';

export interface UpdateTicketStatusRequest {
  status: TicketStatus;
  serviceDate?: string;   // só vai junto quando a transição for pra COMPLETED
}