import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { TicketService } from '../../../services/ticket/ticket-service';
import { TicketCard } from "../../../shared/components/ticket-card/ticket-card";
import { TicketModal } from '../../../shared/components/ticket-modal/ticket-modal';
import { TicketDetail } from '../../../shared/components/ticket-detail/ticket-detail';
import { ProposalsModal } from '../../../shared/components/proposal-modal/proposal-modal';
import { AuthService } from '../../../services/auth/auth';
import { ViewModeService } from '../../../services/view-mode/view-mode-service';
import { Ticket } from '../../../models/ticket.model';

@Component({
  selector: 'app-tickets',
  imports: [TicketCard, TicketModal, TicketDetail, ProposalsModal],
  templateUrl: './tickets.html',
  styleUrl: './tickets.css',
})
export class Tickets implements OnInit {
  tickets: Ticket[] = [];
  availableTickets: Ticket[] = [];
  loading = false;
  error: string | null = null;
  activeModal: 'create' | 'details' | 'proposals' | null = null;
  isModalUrgent = false;
  selectedTicket: Ticket | null = null;

  constructor(
    private ticketService: TicketService,
    private authService: AuthService,
    private viewModeService: ViewModeService,
    private cdr: ChangeDetectorRef
  ) { }

  get isProviderMode() {
    return this.viewModeService.isProviderMode;
  }

  ngOnInit(): void {
    if (this.authService.isProvider()) {
      this.viewModeService.setMode('provider');
    }
    this.loadTickets();
  }

  private async loadTickets(): Promise<void> {
    this.loading = true;
    this.error = null;

    try {
      this.tickets =
        await this.ticketService.getMyTickets();

      if (this.authService.isProvider()) {
        this.availableTickets =
          await this.ticketService.getAvailableTickets();
      }
    } catch (err) {
      console.error(
        'Erro ao carregar tickets:',
        err
      );

      this.error = 'Erro ao carregar tickets.';
      this.tickets = [];
      this.availableTickets = [];

    } finally {
      this.loading = false;
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

  openProposalsModal(ticket: Ticket): void {
    this.selectedTicket = ticket;
    this.activeModal = 'proposals';
  }

  closeModal(): void {
    this.activeModal = null;
    this.isModalUrgent = false;
    this.selectedTicket = null;
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
