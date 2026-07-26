import { TicketStatus } from '../../enums/ticket-status';

export interface UpdateTicketStatusRequest {
  status: TicketStatus;
}