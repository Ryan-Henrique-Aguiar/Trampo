import { ProposalStatus } from '../enums/proposal-status';

export interface Proposal {
  id: number;
  priceRange: number;
  status: ProposalStatus;
  professionalId: number;   // FK -> User.id (role PROFESSIONAL)
  ticketId: number;         // FK -> Ticket.id
}