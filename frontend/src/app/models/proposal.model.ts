import { ProposalStatus } from '../enums/proposal-status';

export interface Proposal {
  id: number;
  priceRange: number;
  status: ProposalStatus;
  professionalId: number;
  professionalName: string;
  professionalPhone: string;
  ticketId: number;
}
