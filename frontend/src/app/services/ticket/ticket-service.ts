import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Ticket {
  id: number;
  code: string;
  type: 'normal' | 'urgent';
  title: string;
  description: string;
  category: string;
  location: string;
  createdAt: string;
  proposals: number;
  status: string;
}

@Injectable({ providedIn: 'root' })
export class TicketService {
  private base = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  getRecent(limit = 3): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(`${this.base}/tickets`);
  }

  getAll(): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(`${this.base}/tickets`);
  }
}