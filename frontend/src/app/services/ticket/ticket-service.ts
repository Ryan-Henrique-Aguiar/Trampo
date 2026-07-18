import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Ticket } from '../../models/ticket.model';
import { CreateTicket } from '../../models/createTicket';

@Injectable({ providedIn: 'root' })
export class TicketService {
  private base = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  // Buscar todos os tickets (sem filtro)
  getAll(): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(`${this.base}/tickets`);
  }

  // Buscar tickets por usuário (filtro por userId)
  getByUserId(userId: string): Observable<Ticket[]> {
    const params = new HttpParams().set('userId', userId);
    return this.http.get<Ticket[]>(`${this.base}/tickets`, { params });
  }

  // Buscar tickets por categoria (para profissionais)
  getByCategory(categoryId: string): Observable<Ticket[]> {
    const params = new HttpParams().set('categoryId', categoryId);
    return this.http.get<Ticket[]>(`${this.base}/tickets`, { params });
  }

  getById(id: number): Observable<Ticket> {
    return this.http.get<Ticket>(`${this.base}/tickets/${id}`);
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