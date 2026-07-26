import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Ticket, UrgentTicket } from '../../models/ticket.model';
import { environment } from '../../../environments/environment.development';
import { CreateTicketRequest } from '../../dto/ticket/create-ticket-request';
import { UpdateTicketStatusRequest } from '../../dto/ticket/update-ticket-status-request';
import { CreateUrgentTicketRequest } from '../../dto/urgent-ticket/create-urgent-ticket-request';
import { TicketStatus } from '../../enums/ticket-status';
import { AuthService } from '../auth/auth';

@Injectable({ providedIn: 'root' })
export class TicketService {
  private idFake = 1;

  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/tickets`;
  private urgentBaseUrl = `${environment.apiUrl}/urgentTickets`;
  private authService = inject(AuthService

  );
  nextId(): number {
    return this.idFake++;
  }

  getTickets(filters?: {
    status?: string;
    categoryId?: number[];
  }): Observable<Ticket[]> {
    let params = new HttpParams();

    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.categoryId?.length) params = params.set('categoryId', filters.categoryId.join(','));

    return this.http.get<Ticket[]>(this.baseUrl, { params });
  }

  getAll(): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(this.baseUrl);
  }

  getById(id: number): Observable<Ticket> {
    return this.http.get<Ticket>(`${this.baseUrl}/${id}`);
  }

  getByUserId(userId: number): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(`${this.baseUrl}?userId=${userId}`);
  }

  // Buscar tickets por categoria (para profissionais)
  getByCategory(categoryId: number): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(`${this.baseUrl}?categoryId=${categoryId}`);
  }

  create(dto: CreateTicketRequest): Observable<Ticket> {
    const payload = {
      id: this.nextId(),
      title: dto.title,
      description: dto.description,
      categoryId: Number(dto.categoryId),
      address: {
        ...dto.address,
        complement: dto.address.complement || '' // evita null
      },
      priceRange: {
        min: dto.priceMin ?? 0,
        max: dto.priceMax ?? 0,
      },
      paymentMethods: dto.paymentMethods || [],
      availableDays: dto.availableDays || [],
      availableHours: dto.availableHours || [],
      serviceDate: dto.serviceDate || new Date().toISOString(),
      createdAt: new Date().toISOString(),
      status: TicketStatus.OPEN,
      userId: this.authService.userId,
      proposalsCount: 0,
    };

    return this.http.post<Ticket>(this.baseUrl, payload);
  }


  createUrgent(dto: CreateUrgentTicketRequest): Observable<UrgentTicket> {
    const payload = {
      id: this.nextId(),
      title: dto.title,
      description: dto.description,
      categoryId: Number(dto.categoryId),
      address: dto.address,
      createdAt: new Date().toISOString(),
      userId: this.authService.userId,
    };

    return this.http.post<UrgentTicket>(this.urgentBaseUrl, payload);
  }

  updateStatus(id: number, dto: UpdateTicketStatusRequest): Observable<Ticket> {
    return this.http.patch<Ticket>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}