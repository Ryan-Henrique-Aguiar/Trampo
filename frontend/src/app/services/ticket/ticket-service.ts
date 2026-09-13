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
import { TicketPage } from '../../models/ticket.model';
@Injectable({ providedIn: 'root' })
export class TicketService {

  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/tickets`;

  private static readonly TICKET_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
    [TicketStatus.OPEN]: [TicketStatus.CANCELLED],
    [TicketStatus.IN_PROGRESS]: [TicketStatus.COMPLETED, TicketStatus.CANCELLED],
    [TicketStatus.COMPLETED]: [],
    [TicketStatus.CANCELLED]: [],
  };

  getAvailableStatusTransitions(currentStatus: TicketStatus): TicketStatus[] {
    return TicketService.TICKET_TRANSITIONS[currentStatus] ?? [];
  }

  async getMyTickets(
    statuses: TicketStatus[] = [],
    page = 0,
    size = 5
  ): Promise<TicketPage> {
    let params = new HttpParams();

    for (const status of statuses) {
      params = params.append('status', status);
    }

    params = params.set('page', page.toString());
    params = params.set('size', size.toString());

    return firstValueFrom(
      this.http.get<TicketPage>(this.baseUrl, { params })
    );
  }


  async getAvailableTickets(
    filters?: AvailableTicketFilters,
    page = 0,
    size = 10
  ): Promise<TicketPage> {
    let params = new HttpParams();

    if (filters?.categoryId != null) {
      params = params.set('categoryId',filters.categoryId.toString());
    }

    if (filters?.minPrice != null) {params = params.set('minPrice',filters.minPrice.toString());
    }

    if (filters?.maxPrice != null) {params = params.set('maxPrice',filters.maxPrice.toString());
    }

    params = params.set('page', page.toString());
    params = params.set('size', size.toString());

    return firstValueFrom(
      this.http.get<TicketPage>(`${this.baseUrl}/available`,{ params })
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
    const payload: UpdateTicketRequest = {
      title: dto.title,
      description: dto.description,
      priceMax: Number(dto.priceMax),
      address: {
        ...dto.address,
        complement: dto.address.complement ?? ''
      },
      paymentMethods: dto.paymentMethods,
      availableDays: dto.availableDays,
      availableHours: dto.availableHours
    };

    const updatedTicket = await firstValueFrom(
      this.http.patch<Ticket>(`${this.baseUrl}/${id}`, payload)
    );

    return updatedTicket;
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
    return firstValueFrom(
      this.http.patch<Ticket>(
        `${this.baseUrl}/${id}/status`,
        payload
      )
    );
  }

}
