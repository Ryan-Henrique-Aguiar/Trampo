import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { Ticket } from '../../../models/ticket.model';
import { Proposal } from '../../../models/proposal.model';

import { ProposalStatus } from '../../../enums/proposal-status';
import { TicketStatus } from '../../../enums/ticket-status';

import { ProposalService } from '../../../services/proposal/proposal-service';

@Component({
  selector: 'app-proposals-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './proposal-modal.html',
  styleUrl: './proposal-modal.css',
})
export class ProposalsModal implements OnChanges {

  @Input() isOpen = false;
  @Input() ticket: Ticket | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() ticketUpdated = new EventEmitter<Ticket>();

  public proposals: Proposal[] = [];

  public isLoading = false;
  public processingProposalId: number | null = null;

  constructor(
    private proposalService: ProposalService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnChanges(): Promise<void> {
    if (this.isOpen && this.ticket) {
      await this.loadProposals(this.ticket.id);
    } else {
      this.proposals = [];
    }

    this.cdr.detectChanges();
  }

  private async loadProposals(ticketId: number): Promise<void> {
    this.isLoading = true;

    try {
      this.proposals = await this.proposalService.getByTicketId(ticketId);
    } catch (err) {
      console.error('Erro ao carregar propostas:', err);

      this.proposals = [];
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  closeModal(): void {
    this.processingProposalId = null;

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

    return `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
  }

  hasValidPhone(proposal: Proposal): boolean {
    return !!proposal.professionalPhone;
  }

  async onAcceptProposal(proposal: Proposal): Promise<void> {
    if (
      this.processingProposalId !== null ||
      !this.ticket
    ) {
      return;
    }

    this.processingProposalId = proposal.id;

    try {
      await this.proposalService.accept(proposal.id);
      this.ticket = {
        ...this.ticket,
        status: TicketStatus.IN_PROGRESS
      };
      this.ticketUpdated.emit(this.ticket);
      await this.loadProposals(this.ticket.id);
    } catch (err) {
      console.error(
        'Erro ao aceitar proposta:',
        err
      );
    } finally {
      this.processingProposalId = null;
      this.cdr.detectChanges();
    }
  }

  async onRejectProposal(proposal: Proposal): Promise<void> {
    if (
      this.processingProposalId !== null ||
      !this.ticket
    ) {
      return;
    }

    this.processingProposalId = proposal.id;

    try {
      await this.proposalService.reject(proposal.id);

      await this.loadProposals(this.ticket.id);
    } catch (err) {
      console.error(
        'Erro ao rejeitar proposta:',
        err
      );
    } finally {
      this.processingProposalId = null;
      this.cdr.detectChanges();
    }
  }

  getStatusLabel(status: ProposalStatus): string {
    const labels: Record<ProposalStatus, string> = {
      [ProposalStatus.PENDING]: 'Pendente',
      [ProposalStatus.ACCEPTED]: 'Aceita',
      [ProposalStatus.REJECTED]: 'Recusada',
    };

    return labels[status] || status;
  }

  formatCurrency(value: number | undefined): string {
    if (value === undefined || value === null) {
      return 'Não informado';
    }

    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }
}
