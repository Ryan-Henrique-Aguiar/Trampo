import { Component, EventEmitter, Output } from '@angular/core';

export interface OpenTicketRequest {
  urgent: boolean;
}

@Component({
  selector: 'app-action-cards',
  imports: [],
  templateUrl: './action-cards.html',
  styleUrl: './action-cards.css',
})
export class ActionCards {
  @Output() openTicket = new EventEmitter<OpenTicketRequest>();

  public requestTicket(urgent: boolean = false): void {
    this.openTicket.emit({ urgent });
  }
}