import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Ticket } from '../../../models/ticket.model';
import { TicketStatus } from '../../../enums/ticket-status';
import { AuthService } from '../../../services/auth/auth';
import { ViewModeService } from '../../../services/view-mode/view-mode-service';

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ticket-detail.html',
  styleUrl: './ticket-detail.css',
})
export class TicketDetail {
  @Input() isOpen = false;
  @Input() ticket: Ticket | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() sendProposal = new EventEmitter<Ticket>();

  private authService = inject(AuthService);
  private viewModeService = inject(ViewModeService);

  get isProviderMode() {
    return this.viewModeService.isProviderMode;
  }

  get canSendProposal(): boolean {
    return this.isProviderMode && this.ticket?.status === TicketStatus.OPEN;
  }

  get isOwnTicket(): boolean {
    return !this.isProviderMode && this.ticket?.userId === this.authService.userId;
  }

  closeModal(): void {
    this.close.emit();
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.closeModal();
    }
  }

  onSendProposal(): void {
    if (this.ticket) {
      this.sendProposal.emit(this.ticket);
    }
  }

  formatDate(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
    return labels[status] || status || 'Desconhecido';
  }

  getStatusClass(status: TicketStatus): string {
    const classes: Record<TicketStatus, string> = {
      [TicketStatus.OPEN]: 'status-open',
      [TicketStatus.IN_NEGOTIATION]: 'status-negotiation',
      [TicketStatus.IN_PROGRESS]: 'status-progress',
      [TicketStatus.COMPLETED]: 'status-completed',
      [TicketStatus.CANCELLED]: 'status-cancelled'
    };
    return classes[status] || 'status-default';
  }

  formatList(list: string[] | undefined): string {
    if (!list || list.length === 0) return 'Não informado';
    return list.join(' • ');
  }

  formatCurrency(value: number | undefined): string {
    if (value === undefined || value === null) return 'Não informado';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }
}