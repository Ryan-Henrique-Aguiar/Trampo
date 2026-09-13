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
  ticketView: 'normal' | 'urgent' = 'normal';
  loadingMyTickets = false;
  loadingAvailableTickets = false;
  loadingMyUrgentTickets = false;
  myTicketsError: string | null = null;
  availableTicketsError: string | null = null;
  myUrgentTicketsError: string | null = null;
  activeModal: 'create' | 'details' | 'urgent-details' | 'proposals' | null = null;
  isModalUrgent = false;
  selectedTicket: Ticket | null = null;
  selectedUrgentTicket: UrgentTicket | null = null;

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
      this.tickets =
        await this.ticketService.getMyTickets();

    } catch (err) {
      console.error(
        'Erro ao carregar tickets do usuário:',
        err
      );

      this.myTicketsError = 'Não foi possível carregar seus serviços.';
      this.tickets = [];

    } finally {
      this.loadingMyTickets = false;
      this.cdr.detectChanges();
    }
  }

  private async loadAvailableTickets(): Promise<void> {
    this.loadingAvailableTickets = true;
    this.availableTicketsError = null;
    try {
      this.availableTickets = await this.ticketService.getAvailableTickets();
    } catch (err) {
      console.error('Erro ao carregar tickets disponíveis:', err);
      this.availableTickets = [];
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
    this.tickets = this.tickets.map(ticket =>
      ticket.id === updatedTicket.id ? updatedTicket : ticket
    );
    this.availableTickets = this.availableTickets.map(ticket =>
      ticket.id === updatedTicket.id ? updatedTicket : ticket
    );
    this.selectedTicket = updatedTicket;
    this.cdr.detectChanges();
  }
  onTicketCreated(ticket: Ticket): void {
    this.tickets = [ticket, ...this.tickets];
    this.cdr.detectChanges();
  }

}
