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

@Component({
  selector: 'app-tickets',
  imports: [TicketCard, UrgentTicketCard, TicketModal, TicketDetail, UrgentTicketDetail, ProposalsModal],
  templateUrl: './tickets.html',
  styleUrl: './tickets.css',
})
export class Tickets implements OnInit {
  tickets: Ticket[] = [];
  availableTickets: Ticket[] = [];
  urgentTickets: UrgentTicket[] = [];
  selectedStatuses: TicketStatus[] = [];

  currentPage = 0;
  readonly pageSize = 5;
  hasNextPage = false;
  availableCurrentPage = 0;
  readonly availablePageSize = 10;
  availableHasNextPage = false;

  loadingMyTickets = false;
  loadingAvailableTickets = false;
  loadingMyUrgentTickets = false;
  myTicketsError: string | null = null;
  availableTicketsError: string | null = null;
  myUrgentTicketsError: string | null = null;

  ticketView: 'normal' | 'urgent' = 'normal';
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

  async loadMyUrgentTickets(): Promise<void> {
    this.loadingMyUrgentTickets = true;
    this.myUrgentTicketsError = null;
    try {
      this.urgentTickets = await this.urgentTicketService.getMyUrgentTickets();
    } catch (err) {
      console.error('Erro ao carregar tickets urgentes do usuário:', err);
      this.urgentTickets = [];
      this.myUrgentTicketsError = 'Não foi possível carregar seus serviços urgentes.';
    } finally {
      this.loadingMyUrgentTickets = false;
      this.cdr.detectChanges();
    }
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
      this.loadMyUrgentTickets();
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
    this.loadMyTickets();
    this.cdr.detectChanges();
  }
  onTicketCreated(ticket: Ticket): void {
    this.currentPage = 0;
    this.loadMyTickets();
  }

}
