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
import { User } from '../../../models/user.model';

import { ProposalStatus } from '../../../enums/proposal-status';
import { TicketStatus } from '../../../enums/ticket-status';

import { ProposalService } from '../../../services/proposal/proposal-service';
import { TicketService } from '../../../services/ticket/ticket-service';
import { UserService } from '../../../services/user/user';

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
  public professionals = new Map<number, User>();

  public isLoading = false;
  public processingProposalId: number | null = null;

  constructor(
    private proposalService: ProposalService,
    private ticketService: TicketService,
    private userService: UserService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnChanges(): Promise<void> {
    if (this.isOpen && this.ticket) {
      await this.loadProposals(this.ticket.id);
    } else {
      this.proposals = [];
      this.professionals = new Map();
    }

    this.cdr.detectChanges();
  }

  private async loadProposals(ticketId: number): Promise<void> {
    this.isLoading = true;

    try {
      this.proposals = await this.proposalService.getByTicketId(ticketId);

      await this.loadProfessionals(this.proposals);
    } catch (err) {
      console.error('Erro ao carregar propostas:', err);

      this.proposals = [];
      this.professionals = new Map();
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  private async loadProfessionals(proposals: Proposal[]): Promise<void> {
    if (proposals.length === 0) {
      this.professionals = new Map();
      return;
    }

    const uniqueIds = [
      ...new Set(
        proposals.map(proposal => proposal.professionalId)
      )
    ];

    const results = await Promise.allSettled(
      uniqueIds.map(id => this.userService.getById(id))
    );

    const professionalsMap = new Map<number, User>();

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        professionalsMap.set(
          result.value.id,
          result.value
        );
      } else {
        console.error(
          `Erro ao carregar prestador ${uniqueIds[index]}:`,
          result.reason
        );
      }
    });

    this.professionals = professionalsMap;
  }

  getProfessional(proposal: Proposal): User | undefined {
    return this.professionals.get(
      proposal.professionalId
    );
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
    const professional = this.getProfessional(proposal);

    const phone = (professional?.phone ?? '')
      .replace(/\D/g, '');

    const name = professional?.name ?? 'prestador';

    const message =
      `Olá ${name}! Vi sua proposta de ${this.formatCurrency(proposal.priceRange)} ` +
      `para o serviço "${this.ticket?.title}" e gostaria de conversar.`;

    return `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
  }

  hasValidPhone(proposal: Proposal): boolean {
    return !!this.getProfessional(proposal)?.phone;
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
      await this.proposalService.accept(proposal);

      const updatedTicket = await this.ticketService.updateStatus(
        this.ticket.id,
        this.ticket.status,
        TicketStatus.IN_PROGRESS
      );

      this.ticket = updatedTicket;

      this.ticketUpdated.emit(updatedTicket);

      await this.rejectRemainingPending(proposal.id);
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

  private async rejectRemainingPending(
    acceptedProposalId: number
  ): Promise<void> {
    if (!this.ticket) return;

    const others = this.proposals.filter(
      proposal =>
        proposal.id !== acceptedProposalId &&
        proposal.status === ProposalStatus.PENDING
    );

    if (others.length > 0) {
      const results = await Promise.allSettled(
        others.map(proposal =>
          this.proposalService.reject(proposal)
        )
      );

      results.forEach(result => {
        if (result.status === 'rejected') {
          console.error(
            'Erro ao rejeitar proposta concorrente:',
            result.reason
          );
        }
      });
    }

    await this.loadProposals(this.ticket.id);
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
      await this.proposalService.reject(proposal);

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