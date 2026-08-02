import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TicketStatus } from '../../../enums/ticket-status';
import { Ticket } from '../../../models/ticket.model';
import { ViewModeService } from '../../../services/view-mode/view-mode-service';

@Component({
  selector: 'app-ticket-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ticket-card.html',
  styleUrl: './ticket-card.css',
})
export class TicketCard {

  private viewModeService = inject(ViewModeService);

  @Input() ticket!: Ticket;
  @Output() viewDetails = new EventEmitter<Ticket>();


  get isProviderMode() {
    return this.viewModeService.isProviderMode;
  }
  // Retorna o label do status
  getStatusLabel(status: TicketStatus): string {
    const labels: Record<TicketStatus, string> = {
      [TicketStatus.OPEN]: 'Aberto',
      [TicketStatus.IN_PROGRESS]: 'Em andamento',
      [TicketStatus.COMPLETED]: 'Finalizado',
      [TicketStatus.CANCELLED]: 'Cancelado'
    };
    return labels[status] || status || 'Desconhecido';
  }

  // Formata data
  formatDate(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  // Formata valor monetário
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  // Emite o evento quando o botão de detalhes é clicado
  onViewDetails(): void {
    this.viewDetails.emit(this.ticket);
  }
}