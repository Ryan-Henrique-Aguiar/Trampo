import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UrgentTicket } from '../../../models/ticket.model';
import { TicketStatus } from '../../../enums/ticket-status';

@Component({
  selector: 'app-urgent-ticket-detail',
  standalone: true,
  templateUrl: './urgent-ticket-detail.html',
  styleUrl: './urgent-ticket-detail.css',
})
export class UrgentTicketDetail {
  @Input() ticket!: UrgentTicket;
  @Output() close = new EventEmitter<void>();

  closeModal(): void {
    this.close.emit();
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.closeModal();
    }
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

  getStatusClass(status: TicketStatus): string {
    const classes: Record<TicketStatus, string> = {
      [TicketStatus.OPEN]: 'status-open',
      [TicketStatus.IN_PROGRESS]: 'status-progress',
      [TicketStatus.COMPLETED]: 'status-completed',
      [TicketStatus.CANCELLED]: 'status-cancelled'
    };
    return classes[status] || 'status-default';
  }
}
