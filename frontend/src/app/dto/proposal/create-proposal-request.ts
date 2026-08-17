// sem id, professionalId (vem do usuário logado) e status (backend define como PENDENTE)
export interface CreateProposalRequest {
  priceRange: number;
  ticketId: number;
}