import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Ticket } from '../../models/ticket.model';
import { CreateTicket } from '../../models/createTicket';

@Injectable({ providedIn: 'root' })
export class TicketService {
  private base = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(`${this.base}/tickets`);
  }

  create(ticket: CreateTicket): Observable<Ticket> {
    return this.http.post<Ticket>(`${this.base}/tickets`, ticket);
  }
  update(id: number, ticket: Ticket): Observable<Ticket> {
    return this.http.put<Ticket>(`${this.base}/tickets/${id}`, ticket);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/tickets/${id}`);
  }
}