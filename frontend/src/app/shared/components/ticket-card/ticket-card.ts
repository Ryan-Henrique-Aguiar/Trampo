import { Component, Input } from '@angular/core';
import { TicketStatus } from '../../../enums/ticket-status';
import { Ticket } from '../../../models/ticket.model';

@Component({
  selector: 'app-ticket-card',
  imports: [],
  templateUrl: './ticket-card.html',
  styleUrl: './ticket-card.css',
})
export class TicketCard {
  @Input() ticket!: Ticket;
  
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
