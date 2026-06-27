import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-ticket-modal',
  imports: [],
  templateUrl: './ticket-modal.html',
  styleUrl: './ticket-modal.css',
})
export class TicketModal {

  @Input() isOpen = false;
  @Input() isUrgent = false;
  @Output() close = new EventEmitter<void>();

  closeModal(): void {
    this.close.emit();
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.closeModal();
    }
  }
}
