import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom, Observable, throwError } from 'rxjs';
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

  async getTickets(filters?: {status?: string; categoryId?: number[];}): Promise<Ticket[]> {
    let params = new HttpParams();
    if (filters?.status) {
      params = params.set('status', filters.status);
    }
    if (filters?.categoryId?.length) {
      params = params.set('categoryId', filters.categoryId.join(','));
    }
    return await firstValueFrom(
      this.http.get<Ticket[]>(this.baseUrl, { params })
    );
  }

  async getAll(): Promise<Ticket[]> {
    return await firstValueFrom(
      this.http.get<Ticket[]>(this.baseUrl)
    )
  }

  async getById(id: number): Promise<Ticket>{
    return await firstValueFrom(
      this.http.get<Ticket>(`${this.baseUrl}/${id}`)
    )
  }


  async getByUserId(userId: number): Promise<Ticket[]> {
    return await firstValueFrom(
      this.http.get<Ticket[]>(`${this.baseUrl}?userId=${userId}`)
    );
  }

  // Buscar tickets por categoria (para profissionais)
  async getByCategory(categoryId: number): Promise<Ticket[]> {
    return await firstValueFrom(
      this.http.get<Ticket[]>(`${this.baseUrl}?categoryId=${categoryId}`)
    );
  }

  async create(dto: CreateTicketRequest): Promise<Ticket> {
    const payload = {
      code: this.generateTicketCode(),
      title: dto.title,
      description: dto.description,
      categoryId: Number(dto.categoryId),

      address: {
        ...dto.address,
        complement: dto.address.complement || ''
      },

      priceMax: Number(dto.priceMax ?? 0),
      paymentMethods: dto.paymentMethods || [],
      availableDays: dto.availableDays || [],
      availableHours: dto.availableHours || [],
      createdAt: new Date().toISOString(),
      status: TicketStatus.OPEN,
      userId: this.authService.currentUser?.id,
      proposalsCount: 0,
    };

    return await firstValueFrom(
      this.http.post<Ticket>(this.baseUrl, payload)
    );
  }


  async createUrgent(dto: CreateUrgentTicketRequest): Promise<UrgentTicket> {
    const payload = {
      title: dto.title,
      code: this.generateUrgentTicketCode(),
      description: dto.description,
      categoryId: Number(dto.categoryId),
      address: dto.address,
      providerId: dto.providerId,
      status: TicketStatus.IN_PROGRESS,
      createdAt: new Date().toISOString(),
      userId: this.authService.currentUser?.id,
    };

    return await firstValueFrom(
      this.http.post<UrgentTicket>(this.urgentBaseUrl, payload)
    );
  }
  
  async update(id: number, dto: UpdateTicketRequest): Promise<Ticket> {
    return await firstValueFrom(
      this.http.patch<Ticket>(`${this.baseUrl}/${id}`, dto)
    );
  }

  async updateStatus(
    id: number,
    currentStatus: TicketStatus,
    newStatus: TicketStatus
  ): Promise<Ticket> {
    const allowed =
      TicketService.TICKET_TRANSITIONS[currentStatus] ?? [];
    if (!allowed.includes(newStatus)) {
      throw new Error(
        `Transição de ${currentStatus} para ${newStatus} não é permitida.`
      );
    }
    const payload: UpdateTicketStatusRequest = {
      status: newStatus
    };
    if (newStatus === TicketStatus.COMPLETED) {
      payload.serviceDate = new Date().toISOString();
    }
    return await firstValueFrom(
      this.http.patch<Ticket>(
        `${this.baseUrl}/${id}`,
        payload
      )
    );
  }

  async updateUrgentStatus(id: number, currentStatus: TicketStatus, newStatus: TicketStatus): Promise<UrgentTicket> {
    const allowed = TicketService.URGENT_TICKET_TRANSITIONS[currentStatus] ?? [];
    if (!allowed.includes(newStatus)) {
      throw new Error(`Transição de ${currentStatus} para ${newStatus} não é permitida.`);
    }

    const payload: UpdateTicketStatusRequest = { status: newStatus };

    if (newStatus === TicketStatus.COMPLETED) {
      payload.serviceDate = new Date().toISOString();
    }

    return await firstValueFrom(
      this.http.patch<UrgentTicket>(`${this.urgentBaseUrl}/${id}`, payload)
    )
  }


  async delete(id: number): Promise<void> {
    return await firstValueFrom(
      this.http.delete<void>(`${this.baseUrl}/${id}`)
    );
  }
}