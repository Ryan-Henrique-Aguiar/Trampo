import { Component } from '@angular/core';
import { TicketModal } from '../ticket-modal/ticket-modal';

@Component({
  selector: 'app-action-cards',
  imports: [TicketModal],
  templateUrl: './action-cards.html',
  styleUrl: './action-cards.css',
})
export class ActionCards {
  isModalOpen = false;
  isUrgent = false;
  openModal(urgent: boolean = false): void {
    this.isUrgent = urgent;
    this.isModalOpen = true;
  }
  closeModal(): void {
    this.isModalOpen = false;
  }
}
