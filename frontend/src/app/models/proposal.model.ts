import { ProposalStatus } from '../enums/proposal-status';

export interface Proposal {
  id: number;
  priceRange: number;
  status: ProposalStatus;
  professionalId: number;   // FK -> User.id (isprovider true)
  ticketId: number;         // FK -> Ticket.id
}