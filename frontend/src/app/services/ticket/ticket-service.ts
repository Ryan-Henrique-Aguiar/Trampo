import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { Ticket, UrgentTicket } from '../../models/ticket.model';
import { environment } from '../../../environments/environment.development';
import { CreateTicketRequest } from '../../dto/ticket/create-ticket-request';
import { UpdateTicketStatusRequest } from '../../dto/ticket/update-ticket-status-request';
import { CreateUrgentTicketRequest } from '../../dto/urgent-ticket/create-urgent-ticket-request';
import { TicketStatus } from '../../enums/ticket-status';
import { AuthService } from '../auth/auth';
import { UpdateTicketRequest } from '../../dto/ticket/update-ticket-request';

@Injectable({ providedIn: 'root' })
export class TicketService {

  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/tickets`;
  private urgentBaseUrl = `${environment.apiUrl}/urgentTickets`;
  private authService = inject(AuthService

  );

  private static readonly TICKET_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
    [TicketStatus.OPEN]: [TicketStatus.IN_PROGRESS, TicketStatus.CANCELLED],
    [TicketStatus.IN_PROGRESS]: [TicketStatus.COMPLETED, TicketStatus.CANCELLED],
    [TicketStatus.COMPLETED]: [],
    [TicketStatus.CANCELLED]: [],
  };

  private static readonly URGENT_TICKET_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
    [TicketStatus.OPEN]: [],                                              // nunca fica OPEN
    [TicketStatus.IN_PROGRESS]: [TicketStatus.COMPLETED, TicketStatus.CANCELLED],
    [TicketStatus.COMPLETED]: [],
    [TicketStatus.CANCELLED]: [],
  };


  private generateTicketCode(): string {
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `TRP-${random}`;
  }
  private generateUrgentTicketCode(): string {
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `TRP-URG-${random}`;
  }

  getAvailableStatusTransitions(currentStatus: TicketStatus): TicketStatus[] {
    return TicketService.TICKET_TRANSITIONS[currentStatus] ?? [];
  }

  getAvailableUrgentStatusTransitions(currentStatus: TicketStatus): TicketStatus[] {
    return TicketService.URGENT_TICKET_TRANSITIONS[currentStatus] ?? [];
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
      code: this.generateTicketCode(),
      title: dto.title,
      description: dto.description,
      categoryId: Number(dto.categoryId),
      address: {
        ...dto.address,
        complement: dto.address.complement || '' // evita null
      },
      priceMax: Number(dto.priceMax ?? 0),
      paymentMethods: dto.paymentMethods || [],
      availableDays: dto.availableDays || [],
      availableHours: dto.availableHours || [],
      createdAt: new Date().toISOString(),
      status: TicketStatus.OPEN,
      userId: this.authService.userId,
      proposalsCount: 0,
    };

    return this.http.post<Ticket>(this.baseUrl, payload);
  }


  createUrgent(dto: CreateUrgentTicketRequest): Observable<UrgentTicket> {
    const payload = {
      title: dto.title,
      code: this.generateUrgentTicketCode(),
      description: dto.description,
      categoryId: Number(dto.categoryId),
      address: dto.address,
      providerId: dto.providerId,
      status: TicketStatus.IN_PROGRESS,
      createdAt: new Date().toISOString(),
      userId: this.authService.userId,
    };

    return this.http.post<UrgentTicket>(this.urgentBaseUrl, payload);
  }
  
  update(id: number, dto: UpdateTicketRequest): Observable<Ticket> {
    return this.http.patch<Ticket>(`${this.baseUrl}/${id}`, dto);
  }

  updateStatus(id: number, currentStatus: TicketStatus, newStatus: TicketStatus): Observable<Ticket> {
    const allowed = TicketService.TICKET_TRANSITIONS[currentStatus] ?? [];

    if (!allowed.includes(newStatus)) {
      return throwError(() => new Error(`Transição de ${currentStatus} para ${newStatus} não é permitida.`));
    }

    const payload: UpdateTicketStatusRequest = { status: newStatus };

    if (newStatus === TicketStatus.COMPLETED) {
      payload.serviceDate = new Date().toISOString();
    }

    return this.http.patch<Ticket>(`${this.baseUrl}/${id}`, payload);
  }

  updateUrgentStatus(id: number, currentStatus: TicketStatus, newStatus: TicketStatus): Observable<UrgentTicket> {
    const allowed = TicketService.URGENT_TICKET_TRANSITIONS[currentStatus] ?? [];

    if (!allowed.includes(newStatus)) {
      return throwError(() => new Error(`Transição de ${currentStatus} para ${newStatus} não é permitida.`));
    }

    const payload: UpdateTicketStatusRequest = { status: newStatus };

    if (newStatus === TicketStatus.COMPLETED) {
      payload.serviceDate = new Date().toISOString();
    }

    return this.http.patch<UrgentTicket>(`${this.urgentBaseUrl}/${id}`, payload);
  }


  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}