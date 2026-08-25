import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom, Observable, throwError } from 'rxjs';
import { Ticket, UrgentTicket } from '../../models/ticket.model';
import { environment } from '../../../environments/environment';
import { CreateTicketRequest } from '../../dto/ticket/create-ticket-request';
import { UpdateTicketStatusRequest } from '../../dto/ticket/update-ticket-status-request';
import { CreateUrgentTicketRequest } from '../../dto/urgent-ticket/create-urgent-ticket-request';
import { TicketStatus } from '../../enums/ticket-status';
import { AuthService } from '../auth/auth';
import { UpdateTicketRequest } from '../../dto/ticket/update-ticket-request';
import { AvailableTicketFilters } from '../../dto/ticket/available-ticket-filters';
@Injectable({ providedIn: 'root' })
export class TicketService {

  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/tickets`;
  private urgentBaseUrl = `${environment.devApiUrl}/urgentTickets`;
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

  getAvailableStatusTransitions(currentStatus: TicketStatus): TicketStatus[] {
    return TicketService.TICKET_TRANSITIONS[currentStatus] ?? [];
  }

  getAvailableUrgentStatusTransitions(currentStatus: TicketStatus): TicketStatus[] {
    return TicketService.URGENT_TICKET_TRANSITIONS[currentStatus] ?? [];
  }

  async getMyTickets(): Promise<Ticket[]> {
    return firstValueFrom(
      this.http.get<Ticket[]>(this.baseUrl)
    );
  }


  async getById(id: number): Promise<Ticket> {
    return await firstValueFrom(
      this.http.get<Ticket>(`${this.baseUrl}/${id}`)
    )
  }

  async getAvailableTickets(filters?: AvailableTicketFilters): Promise<Ticket[]> {
    let params = new HttpParams();

    if (filters?.categoryId != null) {
      params = params.set('categoryId',filters.categoryId.toString());
    }

    if (filters?.minPrice != null) {params = params.set('minPrice',filters.minPrice.toString());
    }

    if (filters?.maxPrice != null) {params = params.set('maxPrice',filters.maxPrice.toString());
    }

    return firstValueFrom(
      this.http.get<Ticket[]>(`${this.baseUrl}/available`,{ params })
    );
  }

  async create(dto: CreateTicketRequest): Promise<Ticket> {
    const payload: CreateTicketRequest = {
      title: dto.title,
      description: dto.description,
      categoryId: Number(dto.categoryId),
      priceMax: Number(dto.priceMax),
      address: {
        ...dto.address,
        complement: dto.address.complement ?? ''
      },
      paymentMethods: dto.paymentMethods ?? [],
      availableDays: dto.availableDays ?? [],
      availableHours: dto.availableHours ?? []
    };

    return firstValueFrom(
      this.http.post<Ticket>(this.baseUrl, payload)
    );
  }


  async createUrgent(dto: CreateUrgentTicketRequest): Promise<UrgentTicket> {
    const payload = {
      title: dto.title,
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
