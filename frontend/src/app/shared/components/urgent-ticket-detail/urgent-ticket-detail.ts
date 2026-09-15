import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { UrgentTicket } from '../../../models/ticket.model';
import { TicketStatus } from '../../../enums/ticket-status';
import { UrgentTicketService } from '../../../services/urgent-ticket/urgent-ticket-service';
import { ToastrService } from '@iqx-limited/ngx-toastr';
import { AuthService } from '../../../services/auth/auth';

@Component({
  selector: 'app-urgent-ticket-detail',
  standalone: true,
  templateUrl: './urgent-ticket-detail.html',
  styleUrl: './urgent-ticket-detail.css',
})
export class UrgentTicketDetail {
  readonly TicketStatus = TicketStatus;
  @Input() ticket!: UrgentTicket;
  @Output() close = new EventEmitter<void>();
  @Output() ticketUpdated = new EventEmitter<UrgentTicket>();

  isStatusMenuOpen = false;
  pendingStatus: TicketStatus | null = null;
  isChangingStatus = false;

  constructor(
    private urgentTicketService: UrgentTicketService,
    private authService: AuthService,
    private toastrService: ToastrService,
    private cdr: ChangeDetectorRef
  ) {}

  get isOwnTicket(): boolean {
    return this.ticket.userId === this.authService.currentUser?.id;
  }

  get canChangeStatus(): boolean {
    const statusAllowsChange = this.ticket.status === TicketStatus.OPEN ||
      this.ticket.status === TicketStatus.IN_PROGRESS;

    return this.isOwnTicket && statusAllowsChange;
  }

  toggleStatusMenu(): void {
    if (this.canChangeStatus) this.isStatusMenuOpen = !this.isStatusMenuOpen;
  }

  selectNewStatus(status: TicketStatus): void {
    if (!this.canChangeStatus) return;
    this.isStatusMenuOpen = false;
    this.pendingStatus = status;
  }

  cancelStatusRequest(): void {
    this.pendingStatus = null;
  }

  async confirmStatusChange(): Promise<void> {
    if (!this.pendingStatus || this.isChangingStatus) return;

    this.isChangingStatus = true;
    try {
      const updatedTicket = await this.urgentTicketService.updateStatus(this.ticket.id, this.pendingStatus);
      this.ticket = updatedTicket;
      this.pendingStatus = null;
      this.ticketUpdated.emit(updatedTicket);
      this.toastrService.success('Status atualizado com sucesso.');
    } catch {
      this.toastrService.error('Não foi possível atualizar o status.');
    } finally {
      this.isChangingStatus = false;
      this.cdr.detectChanges();
    }
  }

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

  getStatusClass(status: TicketStatus): string {
    const classes: Record<TicketStatus, string> = {
      [TicketStatus.OPEN]: 'status-open',
      [TicketStatus.IN_PROGRESS]: 'status-progress',
      [TicketStatus.COMPLETED]: 'status-completed',
      [TicketStatus.CANCELLED]: 'status-cancelled'
    };
    return classes[status];
  }
}
