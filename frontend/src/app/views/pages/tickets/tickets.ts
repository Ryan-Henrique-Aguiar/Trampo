import { ChangeDetectorRef, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TicketService } from '../../../services/ticket/ticket-service';
import { TicketCard } from "../../../shared/components/ticket-card/ticket-card";
import { ActionCards } from "../../../shared/components/action-cards/action-cards";
import { AuthService } from '../../../services/auth/auth';
import { ViewModeService } from '../../../services/view-mode/view-mode-service';
import { Ticket } from '../../../models/ticket.model';

@Component({
  selector: 'app-tickets',
  imports: [TicketCard, ActionCards, RouterLink],
  templateUrl: './tickets.html',
  styleUrl: './tickets.css',
})
export class Tickets implements OnInit {
  tickets: Ticket[] = [];
  availableTickets: Ticket[] = [];
  loading = false;
  error: string | null = null;

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

}