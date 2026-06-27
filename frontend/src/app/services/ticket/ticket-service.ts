import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Ticket } from '../../models/ticket.model';

@Injectable({ providedIn: 'root' })
export class TicketService {
  private base = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(`${this.base}/tickets`);
  }

  create(ticket: any): Observable<Ticket> {
    return this.http.post<Ticket>(`${this.base}/tickets`, ticket);
  }
}