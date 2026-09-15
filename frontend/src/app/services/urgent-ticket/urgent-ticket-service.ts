import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { CreateUrgentTicketRequest } from '../../dto/urgent-ticket/create-urgent-ticket-request';
import { UrgentTicket, UrgentTicketPage } from '../../models/ticket.model';
import { TicketStatus } from '../../enums/ticket-status';

@Injectable({ providedIn: 'root' })
export class UrgentTicketService {
  private baseUrl = `${environment.apiUrl}/urgenttickets`;

  constructor(private http: HttpClient) {}

  getMyUrgentTickets(
    statuses: TicketStatus[] = [],
    page = 0,
    size = 5
  ): Promise<UrgentTicketPage> {
    let params: Record<string, string | number | string[]> = { page, size };
    if (statuses.length > 0) {
      params = { ...params, status: statuses };
    }

    return firstValueFrom(
      this.http.get<UrgentTicketPage>(this.baseUrl, { params })
    );
  }

  create(dto: CreateUrgentTicketRequest): Promise<UrgentTicket> {
    const payload: CreateUrgentTicketRequest = {
      title: dto.title,
      description: dto.description,
      categoryId: Number(dto.categoryId),
      address: dto.address,
      providerId: Number(dto.providerId),
    };

    return firstValueFrom(
      this.http.post<UrgentTicket>(this.baseUrl, payload)
    );
  }

  getMyProvidedUrgentTickets(
    statuses: TicketStatus[] = [],
    page = 0,
    size = 10
  ): Promise<UrgentTicketPage> {
    let params: Record<string, string | number | string[]> = { page, size };
    if (statuses.length > 0) {
      params = { ...params, status: statuses };
    }

    return firstValueFrom(
      this.http.get<UrgentTicketPage>(`${this.baseUrl}/assigned`, { params })
    );
  }

  updateStatus(id: number, status: TicketStatus): Promise<UrgentTicket> {
    return firstValueFrom(
      this.http.patch<UrgentTicket>(`${this.baseUrl}/${id}/status`, { status })
    );
  }
}
