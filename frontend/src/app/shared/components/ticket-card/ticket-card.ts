import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TicketStatus } from '../../../enums/ticket-status';
import { Ticket } from '../../../models/ticket.model';
import { ViewModeService } from '../../../services/view-mode/view-mode-service';

@Component({
  selector: 'app-ticket-card',
  templateUrl: './ticket-card.html',
  styleUrl: './ticket-card.css',
})
export class TicketCard {
  @Input() ticket!: Ticket;
  @Output() viewDetails = new EventEmitter<Ticket>();
  @Output() viewProposals = new EventEmitter<Ticket>();

  constructor(private viewModeService: ViewModeService) {}

  get isProviderMode() {
    return this.viewModeService.isProviderMode;
  }

  getStatusLabel(status: TicketStatus): string {
    const labels: Record<TicketStatus, string> = {
      [TicketStatus.OPEN]: 'Aberto',
      [TicketStatus.IN_PROGRESS]: 'Em andamento',
      [TicketStatus.COMPLETED]: 'Finalizado',
      [TicketStatus.CANCELLED]: 'Cancelado'
    };
    return labels[status];
  }

  formatDate(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  onViewDetails(): void {
    this.viewDetails.emit(this.ticket);
  }

  onViewProposals(): void {
    this.viewProposals.emit(this.ticket);
  }
}
