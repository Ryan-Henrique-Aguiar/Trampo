import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UrgentTicket } from '../../../models/ticket.model';
import { TicketStatus } from '../../../enums/ticket-status';
import { AuthService } from '../../../services/auth/auth';

@Component({
  selector: 'app-urgent-ticket-card',
  standalone: true,
  templateUrl: './urgent-ticket-card.html',
  styleUrl: './urgent-ticket-card.css',
})
export class UrgentTicketCard {
  @Input() ticket!: UrgentTicket;
  @Output() viewDetails = new EventEmitter<UrgentTicket>();

  constructor(private authService: AuthService) {}

  get otherPersonName(): string {
    return this.ticket.userId === this.authService.currentUser?.id
      ? this.ticket.providerName
      : this.ticket.userName;
  }

  getStatusLabel(status: TicketStatus): string {
    const labels: Record<TicketStatus, string> = {
      [TicketStatus.OPEN]: 'Aberto',
      [TicketStatus.IN_PROGRESS]: 'Em andamento',
      [TicketStatus.COMPLETED]: 'Finalizado',
      [TicketStatus.CANCELLED]: 'Cancelado'
    };
    return labels[status] || status || 'Desconhecido';
  }

  formatDate(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  onViewDetails(): void {
    this.viewDetails.emit(this.ticket);
  }
}
