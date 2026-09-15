import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output
} from '@angular/core';

import { Ticket } from '../../../models/ticket.model';
import { Proposal } from '../../../models/proposal.model';

import { ProposalStatus } from '../../../enums/proposal-status';
import { TicketStatus } from '../../../enums/ticket-status';

import { ProposalService } from '../../../services/proposal/proposal-service';

@Component({
  selector: 'app-proposals-modal',
  templateUrl: './proposal-modal.html',
  styleUrl: './proposal-modal.css',
})
export class ProposalsModal implements OnInit {

  @Input() ticket: Ticket | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() ticketUpdated = new EventEmitter<Ticket>();

  proposals: Proposal[] = [];
  proposalsError: string | null = null;

  isLoading = false;
  isProcessing = false;

  constructor(
    private proposalService: ProposalService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (this.ticket) {
      this.loadProposals(this.ticket.id);
    }
  }
  private async loadProposals(ticketId: number): Promise<void> {
    this.isLoading = true;
    this.proposalsError = null;

    try {
      this.proposals = await this.proposalService.getByTicketId(ticketId);
    } catch (err) {
      console.error('Erro ao carregar propostas:', err);

      this.proposals = [];
      this.proposalsError = 'Não foi possível carregar as propostas.';
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  closeModal(): void {
    this.isProcessing = false;
    this.proposalsError = null;
    this.close.emit();
  }

  onOverlayClick(event: MouseEvent): void {
    if (
      (event.target as HTMLElement)
        .classList
        .contains('modal-overlay')
    ) {
      this.closeModal();
    }
  }

  getWhatsAppLink(proposal: Proposal): string {
    const phone = (proposal.professionalPhone ?? '')
      .replace(/\D/g, '');

    const name = proposal.professionalName || 'prestador';

    const message =
      `Olá ${name}! Vi sua proposta de ${this.formatCurrency(proposal.priceRange)} ` +
      `para o serviço "${this.ticket?.title}" e gostaria de conversar.`;

    const whatsappPhone = phone.length <= 11
      ? `55${phone}`
      : phone;

    return `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(message)}`;
  }

  hasValidPhone(proposal: Proposal): boolean {
    const phone = proposal.professionalPhone?.replace(/\D/g, '') ?? '';
    return phone.length >= 10;
  }

  async onAcceptProposal(proposal: Proposal): Promise<void> {
    if (
      this.isProcessing ||
      !this.ticket
    ) {
      return;
    }

    this.isProcessing = true;
    this.proposalsError = null;

    try {
      await this.proposalService.accept(proposal.id);
      this.ticket = {
        ...this.ticket,
        status: TicketStatus.IN_PROGRESS
      };
      this.ticketUpdated.emit(this.ticket);
      await this.loadProposals(this.ticket.id);
    } catch (err) {
      console.error('Erro ao aceitar proposta:', err);
      this.proposalsError = 'Não foi possível aceitar a proposta.';
    } finally {
      this.isProcessing = false;
      this.cdr.detectChanges();
    }
  }

  async onRejectProposal(proposal: Proposal): Promise<void> {
    if (
      this.isProcessing ||
      !this.ticket
    ) {
      return;
    }

    this.isProcessing = true;
    this.proposalsError = null;

    try {
      await this.proposalService.reject(proposal.id);

      await this.loadProposals(this.ticket.id);
    } catch (err) {
      console.error('Erro ao rejeitar proposta:', err);
      this.proposalsError = 'Não foi possível recusar a proposta.';
    } finally {
      this.isProcessing = false;
      this.cdr.detectChanges();
    }
  }

  getStatusLabel(status: ProposalStatus): string {
    const labels: Record<ProposalStatus, string> = {
      [ProposalStatus.PENDING]: 'Pendente',
      [ProposalStatus.ACCEPTED]: 'Aceita',
      [ProposalStatus.REJECTED]: 'Recusada',
    };

    return labels[status];
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }
}
