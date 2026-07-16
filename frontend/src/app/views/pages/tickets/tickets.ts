import { Component, OnInit, signal } from '@angular/core';
import { Ticket } from '../../../models/ticket.model';
import { TicketService } from '../../../services/ticket/ticket-service';
import { TicketStatus } from '../../../enums/ticket-status';
import { TicketCard } from "../../../shared/components/ticket-card/ticket-card";
import { ActionCards } from "../../../shared/components/action-cards/action-cards";

@Component({
  selector: 'app-tickets',
  imports: [TicketCard, ActionCards],
  templateUrl: './tickets.html',
  styleUrl: './tickets.css',
})
export class Tickets implements OnInit {
  mode: 'client' | 'provider' = 'client';
  tickets = signal<Ticket[]>([]);
  availableTickets = signal<Ticket[]>([]);

  constructor(
    private ticketService: TicketService
  ) {}

  ngOnInit(): void {
    this.loadTickets();
  }

  private loadTickets(): void {
    this.ticketService.getAll().subscribe({
      next: (tickets) => {
        this.tickets.set(tickets);
      },
      error: (err) => {
        console.error('Erro ao carregar tickets:', err);
        this.tickets.set([]); 
      }
    });
  }

  getStatusLabel(status: TicketStatus): string {
    const labels: Record<TicketStatus, string> = {
      [TicketStatus.OPEN]: 'Aberto',
      [TicketStatus.WITH_PROPOSALS]: 'Com propostas',
      [TicketStatus.IN_PROGRESS]: 'Em andamento',
      [TicketStatus.COMPLETED]: 'Finalizado',
      [TicketStatus.CANCELLED]: 'Cancelado'
    };

    return labels[status];
  }




}
