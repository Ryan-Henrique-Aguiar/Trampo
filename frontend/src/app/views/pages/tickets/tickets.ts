import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Ticket } from '../../../models/ticket.model';
import { TicketService } from '../../../services/ticket/ticket-service';
import { TicketStatus } from '../../../enums/ticket-status';
import { TicketCard } from "../../../shared/components/ticket-card/ticket-card";
import { ActionCards } from "../../../shared/components/action-cards/action-cards";
import { AuthService } from '../../../services/auth/auth';
import { ViewModeService } from '../../../services/view-mode/view-mode-service';

@Component({
  selector: 'app-tickets',
  imports: [TicketCard, ActionCards, RouterLink],
  templateUrl: './tickets.html',
  styleUrl: './tickets.css',
})
export class Tickets implements OnInit {
  tickets = signal<Ticket[]>([]);
  availableTickets = signal<Ticket[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  private ticketService = inject(TicketService);
  private authService = inject(AuthService);
  private viewModeService = inject(ViewModeService);

  get isProviderMode() {
    return this.viewModeService.isProviderMode;
  }

  ngOnInit(): void {
    if (this.authService.isProvider) {
      this.viewModeService.setMode('provider');
    }
    this.loadTickets();
  }

  private loadTickets(): void {
    const userId = this.authService.userId;
    if (userId === undefined) {
      this.error.set('Usuário não autenticado.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    // Meus tickets como cliente (backend cuida via token)
    this.ticketService.getTickets().subscribe({
      next: (myTickets) => {
        this.tickets.set(myTickets);

        if (this.authService.isProvider) {
          this.ticketService.getTickets({
            status: TicketStatus.OPEN,
            categoryId: this.authService.userCategories
          }).subscribe({
            next: (available) => {
              this.availableTickets.set(available);
              this.loading.set(false);
            },
            error: (err) => {
              console.error('Erro ao carregar tickets disponíveis:', err);
              this.availableTickets.set([]);
              this.loading.set(false);
            }
          });
        } else {
          this.loading.set(false);
        }
      },
      error: (err) => {
        console.error('Erro ao carregar seus tickets:', err);
        this.error.set('Erro ao carregar tickets.');
        this.tickets.set([]);
        this.loading.set(false);
      }
    });
  }

  getStatusLabel(status: TicketStatus): string {
    const labels: Record<TicketStatus, string> = {
      [TicketStatus.OPEN]: 'Aberto',
      [TicketStatus.IN_NEGOTIATION]: 'Em negociação',
      [TicketStatus.IN_PROGRESS]: 'Em andamento',
      [TicketStatus.COMPLETED]: 'Finalizado',
      [TicketStatus.CANCELLED]: 'Cancelado'
    };
    return labels[status] || status;
  }
}