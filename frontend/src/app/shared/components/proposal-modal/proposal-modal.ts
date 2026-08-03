import { Component, EventEmitter, Input, Output, OnChanges, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
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

  private proposalService = inject(ProposalService);
  private ticketService = inject(TicketService);
  private userService = inject(UserService);

  public proposals = signal<Proposal[]>([]);
  public professionals = signal<Map<number, User>>(new Map());
  public isLoading = signal(false);
  public processingProposalId = signal<number | null>(null);

  ngOnChanges(): void {
    if (this.isOpen && this.ticket) {
      this.loadProposals(this.ticket.id);
    } else {
      this.proposals.set([]);
      this.professionals.set(new Map());
    }
  }

  private loadProposals(ticketId: number): void {
    this.isLoading.set(true);
    this.proposalService.getByTicketId(ticketId).subscribe({
      next: (proposals) => {
        this.proposals.set(proposals);
        this.loadProfessionals(proposals);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Erro ao carregar propostas:', err);
        this.proposals.set([]);
        this.isLoading.set(false);
      },
    });
  }

  private loadProfessionals(proposals: Proposal[]): void {
    if (proposals.length === 0) {
      this.professionals.set(new Map());
      this.isLoading.set(false);
      return;
    }

    const uniqueIds = [...new Set(proposals.map(p => p.professionalId))];

    forkJoin(
      uniqueIds.map(id =>
        this.userService.getById(id).pipe(
          catchError((err: HttpErrorResponse) => {
            console.error(`Erro ao carregar prestador ${id}:`, err);
            return of(null);
          })
        )
      )
    ).subscribe((users) => {
      const map = new Map<number, User>();
      users.forEach(user => {
        if (user) map.set(user.id, user);
      });
      this.professionals.set(map);
      this.isLoading.set(false);
    });
  }

  getProfessional(proposal: Proposal): User | undefined {
    return this.professionals().get(proposal.professionalId);
  }

  closeModal(): void {
    this.processingProposalId.set(null);
    this.close.emit();
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.closeModal();
    }
  }

  // ===== CONTATO VIA WHATSAPP =====
  getWhatsAppLink(proposal: Proposal): string {
    const professional = this.getProfessional(proposal);
    const phone = (professional?.phone || '').replace(/\D/g, '');
    const name = professional?.name || 'prestador';
    const message = `Olá ${name}! Vi sua proposta de ${this.formatCurrency(proposal.priceRange)} para o serviço "${this.ticket?.title}" e gostaria de conversar.`;
    return `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
  }

  hasValidPhone(proposal: Proposal): boolean {
    return !!this.getProfessional(proposal)?.phone;
  }

  // ===== ACEITAR PROPOSTA =====
  onAcceptProposal(proposal: Proposal): void {
    if (this.processingProposalId() !== null || !this.ticket) return;
    this.processingProposalId.set(proposal.id);

    this.proposalService.accept(proposal).subscribe({
      next: () => {
        this.ticketService.updateStatus(this.ticket!.id, this.ticket!.status, TicketStatus.IN_PROGRESS).subscribe({
          next: (updatedTicket) => {
            this.ticket = updatedTicket;
            this.ticketUpdated.emit(updatedTicket);
            this.rejectRemainingPending(proposal.id);
          },
          error: (err: HttpErrorResponse) => {
            this.processingProposalId.set(null);
            console.error('Erro ao atualizar status do ticket:', err);
          },
        });
      },
      error: (err: HttpErrorResponse) => {
        this.processingProposalId.set(null);
        console.error('Erro ao aceitar proposta:', err);
      },
    });
  }

  private rejectRemainingPending(acceptedProposalId: number): void {
    const others = this.proposals().filter(
      p => p.id !== acceptedProposalId && p.status === ProposalStatus.PENDING
    );

    if (others.length === 0) {
      this.processingProposalId.set(null);
      this.loadProposals(this.ticket!.id);
      return;
    }

    let remaining = others.length;
    others.forEach(p => {
      this.proposalService.reject(p).subscribe({
        next: () => {
          remaining--;
          if (remaining === 0) {
            this.processingProposalId.set(null);
            this.loadProposals(this.ticket!.id);
          }
        },
        error: (err: HttpErrorResponse) => {
          console.error('Erro ao rejeitar proposta concorrente:', err);
          remaining--;
          if (remaining === 0) {
            this.processingProposalId.set(null);
            this.loadProposals(this.ticket!.id);
          }
        },
      });
    });
  }

  onRejectProposal(proposal: Proposal): void {
    if (this.processingProposalId() !== null || !this.ticket) return;
    this.processingProposalId.set(proposal.id);

    this.proposalService.reject(proposal).subscribe({
      next: () => {
        this.processingProposalId.set(null);
        this.loadProposals(this.ticket!.id);
      },
      error: (err: HttpErrorResponse) => {
        this.processingProposalId.set(null);
        console.error('Erro ao rejeitar proposta:', err);
      },
    });
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
    if (value === undefined || value === null) return 'Não informado';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }
}