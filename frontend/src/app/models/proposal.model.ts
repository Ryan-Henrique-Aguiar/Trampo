import { ProposalStatus } from '../enums/proposal-status';
import { Ticket } from './ticket.model';

export interface Proposal {
  id: number;
  priceRange: number;
  status: ProposalStatus;
  professionalId: number;
  professionalName: string;
  professionalPhone: string;
  professionalRating: number | null;
  ticketId: number;
}

export interface MyProposal {
  proposal: Proposal;
  ticket: Ticket;
}

export interface MyProposalPage {
  content: MyProposal[];
  hasNext: boolean;
}
