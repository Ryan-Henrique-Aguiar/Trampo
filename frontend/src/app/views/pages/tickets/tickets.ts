import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { TicketService } from '../../../services/ticket/ticket-service';
import { TicketCard } from "../../../shared/components/ticket-card/ticket-card";
import { TicketModal } from '../../../shared/components/ticket-modal/ticket-modal';
import { TicketDetail } from '../../../shared/components/ticket-detail/ticket-detail';
import { ProposalsModal } from '../../../shared/components/proposal-modal/proposal-modal';
import { AuthService } from '../../../services/auth/auth';
import { ViewModeService } from '../../../services/view-mode/view-mode-service';
import { Ticket, UrgentTicket } from '../../../models/ticket.model';
import { UrgentTicketService } from '../../../services/urgent-ticket/urgent-ticket-service';
import { UrgentTicketCard } from '../../../shared/components/urgent-ticket-card/urgent-ticket-card';
import { UrgentTicketDetail } from '../../../shared/components/urgent-ticket-detail/urgent-ticket-detail';
import { TicketStatus } from '../../../enums/ticket-status';
import { MyProposal } from '../../../models/proposal.model';
import { ProposalService } from '../../../services/proposal/proposal-service';
import { ProposalStatus } from '../../../enums/proposal-status';

@Component({
  selector: 'app-tickets',
  imports: [TicketCard, UrgentTicketCard, TicketModal, TicketDetail, UrgentTicketDetail, ProposalsModal],
  templateUrl: './tickets.html',
  styleUrl: './tickets.css',
})
export class Tickets implements OnInit {
  tickets: Ticket[] = [];
  availableTickets: Ticket[] = [];
  myProposals: MyProposal[] = [];
  urgentTickets: UrgentTicket[] = [];
  selectedStatuses: TicketStatus[] = [];
  selectedUrgentStatuses: TicketStatus[] = [];

  currentPage = 0;
  readonly pageSize = 5;
  hasNextPage = false;
  availableCurrentPage = 0;
  readonly availablePageSize = 10;
  availableHasNextPage = false;
  proposalsCurrentPage = 0;
  readonly proposalsPageSize = 10;
  proposalsHasNextPage = false;
  urgentCurrentPage = 0;
  readonly urgentPageSize = 5;
  urgentHasNextPage = false;

  loadingMyTickets = false;
  loadingAvailableTickets = false;
  loadingMyProposals = false;
  loadingMyUrgentTickets = false;

  myTicketsError: string | null = null;
  availableTicketsError: string | null = null;
  myProposalsError: string | null = null;
  myUrgentTicketsError: string | null = null;


  selectedProposalStatuses: ProposalStatus[] = [ProposalStatus.PENDING];
  readonly proposalStatusOptions = [
    { value: ProposalStatus.PENDING, label: 'Pendentes' },
    { value: ProposalStatus.ACCEPTED, label: 'Aceitas' },
    { value: ProposalStatus.REJECTED, label: 'Recusadas' }
  ];

  ticketView: 'normal' | 'urgent' = 'normal';
  providerView: 'available' | 'proposals' = 'available';
  activeModal: 'create' | 'details' | 'urgent-details' | 'proposals' | null = null;
  isModalUrgent = false;
  selectedTicket: Ticket | null = null;
  selectedUrgentTicket: UrgentTicket | null = null;
  readonly statusOptions = [
    { value: TicketStatus.OPEN, label: 'Abertos' },
    { value: TicketStatus.IN_PROGRESS, label: 'Em andamento' },
    { value: TicketStatus.COMPLETED, label: 'Concluídos' },
    { value: TicketStatus.CANCELLED, label: 'Cancelados' }
  ];

  constructor(
    private ticketService: TicketService,
    private proposalService: ProposalService,
    private urgentTicketService: UrgentTicketService,
    private authService: AuthService,
    private viewModeService: ViewModeService,
    private cdr: ChangeDetectorRef
  ) { }

  get isProviderMode() {
    return this.viewModeService.isProviderMode;
  }

  ngOnInit(): void {
    this.loadMyTickets();
    this.loadMyUrgentTickets();
    if (this.authService.isProvider()) {
      this.loadAvailableTickets();
    }
  }

  changeProviderView(view: 'available' | 'proposals'): void {
    this.providerView = view;
    if (view === 'available') {
      this.loadAvailableTickets();
    } else {
      this.loadMyProposals();
    }
  }

  async loadMyUrgentTickets(): Promise<void> {
    this.loadingMyUrgentTickets = true;
    this.myUrgentTicketsError = null;
    try {
      const response = await this.urgentTicketService.getMyUrgentTickets(this.selectedUrgentStatuses, this.urgentCurrentPage, this.urgentPageSize);
      this.urgentTickets = response.content;
      this.urgentHasNextPage = response.hasNext;
    } catch (err) {
      console.error('Erro ao carregar tickets urgentes do usuário:', err);
      this.urgentTickets = [];
      this.urgentHasNextPage = false;
      this.myUrgentTicketsError = 'Não foi possível carregar seus serviços urgentes.';
    } finally {
      this.loadingMyUrgentTickets = false;
      this.cdr.detectChanges();
    }
  }

  changeUrgentPage(page: number): void {
    if (page < 0 || page === this.urgentCurrentPage || (page > this.urgentCurrentPage && !this.urgentHasNextPage)) return;
    this.urgentCurrentPage = page;
    this.loadMyUrgentTickets();
  }

  toggleUrgentStatus(status: TicketStatus): void {
    this.selectedUrgentStatuses = this.selectedUrgentStatuses.includes(status)
      ? this.selectedUrgentStatuses.filter(item => item !== status)
      : [...this.selectedUrgentStatuses, status];
    this.urgentCurrentPage = 0;
    this.loadMyUrgentTickets();
  }

  private async loadMyTickets(): Promise<void> {
    this.loadingMyTickets = true;
    this.myTicketsError = null;

    try {
      const response = await this.ticketService.getMyTickets(
        this.selectedStatuses,
        this.currentPage,
        this.pageSize
      );

      this.tickets = response.content;
      this.hasNextPage = response.hasNext;

    } catch (err) {
      console.error(
        'Erro ao carregar tickets do usuário:',
        err
      );

      this.myTicketsError = 'Não foi possível carregar seus serviços.';
      this.tickets = [];
      this.hasNextPage = false;

    } finally {
      this.loadingMyTickets = false;
      this.cdr.detectChanges();
    }
  }

  toggleStatus(status: TicketStatus): void {
    this.selectedStatuses = this.selectedStatuses.includes(status)
      ? this.selectedStatuses.filter(item => item !== status)
      : [...this.selectedStatuses, status];

    this.currentPage = 0;
    this.loadMyTickets();
  }

  clearFilters(): void {
    this.selectedStatuses = [];
    this.currentPage = 0;
    this.loadMyTickets();
  }

  changePage(page: number): void {
    if (page < 0 || page === this.currentPage || (page > this.currentPage && !this.hasNextPage)) {
      return;
    }

    this.currentPage = page;
    this.loadMyTickets();
  }

  changeAvailablePage(page: number): void {
    if (page < 0 || page === this.availableCurrentPage || (page > this.availableCurrentPage && !this.availableHasNextPage)) {
      return;
    }

    this.availableCurrentPage = page;
    this.loadAvailableTickets();
  }

  changeProposalsPage(page: number): void {
    if (page < 0 || page === this.proposalsCurrentPage || (page > this.proposalsCurrentPage && !this.proposalsHasNextPage)) return;
    this.proposalsCurrentPage = page;
    this.loadMyProposals();
  }

  toggleProposalStatus(status: ProposalStatus): void {
    this.selectedProposalStatuses = this.selectedProposalStatuses.includes(status)
      ? this.selectedProposalStatuses.filter(item => item !== status)
      : [...this.selectedProposalStatuses, status];
    this.proposalsCurrentPage = 0;
    this.loadMyProposals();
  }

  clearProposalFilters(): void {
    this.selectedProposalStatuses = [];
    this.proposalsCurrentPage = 0;
    this.loadMyProposals();
  }

  getProposalStatusLabel(status: ProposalStatus): string {
    const labels: Record<ProposalStatus, string> = {
      [ProposalStatus.PENDING]: 'Pendente',
      [ProposalStatus.ACCEPTED]: 'Aceita',
      [ProposalStatus.REJECTED]: 'Recusada'
    };
    return labels[status];
  }

  formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  get hasActiveFilters(): boolean {
    return this.selectedStatuses.length > 0;
  }

  private async loadAvailableTickets(): Promise<void> {
    this.loadingAvailableTickets = true;
    this.availableTicketsError = null;
    try {
      const response = await this.ticketService.getAvailableTickets(
        undefined,
        this.availableCurrentPage,
        this.availablePageSize
      );
      this.availableTickets = response.content;
      this.availableHasNextPage = response.hasNext;
    } catch (err) {
      console.error('Erro ao carregar tickets disponíveis:', err);
      this.availableTickets = [];
      this.availableHasNextPage = false;
      this.availableTicketsError = 'Não foi possível carregar os serviços disponíveis.';
    } finally {
      this.loadingAvailableTickets = false;
      this.cdr.detectChanges();
    }
  }

  async loadMyProposals(): Promise<void> {
    this.loadingMyProposals = true;
    this.myProposalsError = null;
    try {
      const response = await this.proposalService.getMyProposals(
        this.selectedProposalStatuses,
        this.proposalsCurrentPage,
        this.proposalsPageSize
      );
      this.myProposals = response.content;
      this.proposalsHasNextPage = response.hasNext;
    } catch (err) {
      console.error('Erro ao carregar propostas do prestador:', err);
      this.myProposals = [];
      this.proposalsHasNextPage = false;
      this.myProposalsError = 'Não foi possível carregar suas propostas.';
    } finally {
      this.loadingMyProposals = false;
      this.cdr.detectChanges();
    }
  }

  openTicketModal(isUrgent: boolean): void {
    this.isModalUrgent = isUrgent;
    this.activeModal = 'create';
  }

  openTicketDetail(ticket: Ticket): void {
    this.selectedTicket = ticket;
    this.activeModal = 'details';
  }

  openUrgentTicketDetail(ticket: UrgentTicket): void {
    this.selectedUrgentTicket = ticket;
    this.activeModal = 'urgent-details';
    this.cdr.detectChanges();
  }

  openProposalsModal(ticket: Ticket): void {
    this.selectedTicket = ticket;
    this.activeModal = 'proposals';
  }

  closeModal(): void {
    if (this.activeModal === 'create' && this.isModalUrgent) {
      this.urgentCurrentPage = 0;
    }
    this.activeModal = null;
    this.isModalUrgent = false;
    this.selectedTicket = null;
    this.selectedUrgentTicket = null;
  }

  onTicketUpdated(updatedTicket: Ticket): void {
    this.availableTickets = this.availableTickets.map(ticket =>
      ticket.id === updatedTicket.id ? updatedTicket : ticket
    );
    this.selectedTicket = updatedTicket;
    if (this.isProviderMode) {
      this.availableCurrentPage = 0;
      this.loadAvailableTickets();
      this.proposalsCurrentPage = 0;
      this.loadMyProposals();
    } else {
      this.loadMyTickets();
    }
    this.cdr.detectChanges();
  }
  onUrgentTicketUpdated(updatedTicket: UrgentTicket): void {
    this.selectedUrgentTicket = updatedTicket;
    this.loadMyUrgentTickets();
  }
  onTicketCreated(ticket: Ticket): void {
    this.currentPage = 0;
    this.loadMyTickets();
  }

}
