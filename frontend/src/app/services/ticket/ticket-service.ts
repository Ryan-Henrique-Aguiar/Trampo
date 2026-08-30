import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Ticket } from '../../models/ticket.model';
import { environment } from '../../../environments/environment';
import { CreateTicketRequest } from '../../dto/ticket/create-ticket-request';
import { UpdateTicketStatusRequest } from '../../dto/ticket/update-ticket-status-request';
import { TicketStatus } from '../../enums/ticket-status';
import { UpdateTicketRequest } from '../../dto/ticket/update-ticket-request';
import { AvailableTicketFilters } from '../../dto/ticket/available-ticket-filters';
@Injectable({ providedIn: 'root' })
export class TicketService {

  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/tickets`;

  private static readonly TICKET_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
    [TicketStatus.OPEN]: [TicketStatus.IN_PROGRESS, TicketStatus.CANCELLED],
    [TicketStatus.IN_PROGRESS]: [TicketStatus.COMPLETED, TicketStatus.CANCELLED],
    [TicketStatus.COMPLETED]: [],
    [TicketStatus.CANCELLED]: [],
  };

  getAvailableStatusTransitions(currentStatus: TicketStatus): TicketStatus[] {
    return TicketService.TICKET_TRANSITIONS[currentStatus] ?? [];
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

  async delete(id: number): Promise<void> {
    return await firstValueFrom(
      this.http.delete<void>(`${this.baseUrl}/${id}`)
    );
  }
}
