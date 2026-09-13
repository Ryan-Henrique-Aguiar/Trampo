import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { CreateUrgentTicketRequest } from '../../dto/urgent-ticket/create-urgent-ticket-request';
import { UrgentTicket } from '../../models/ticket.model';
import { TicketStatus } from '../../enums/ticket-status';

@Injectable({ providedIn: 'root' })
export class UrgentTicketService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/urgenttickets`;

  async getMyUrgentTickets(statuses: TicketStatus[] = [], page = 0, size = 5): Promise<{ content: UrgentTicket[]; hasNext: boolean }> {
    let params: Record<string, string | number | string[]> = { page, size };
    if (statuses.length > 0) params = { ...params, status: statuses };
    return firstValueFrom(this.http.get<{ content: UrgentTicket[]; hasNext: boolean }>(this.baseUrl, { params }));
  }

  async create(dto: CreateUrgentTicketRequest): Promise<UrgentTicket> {
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
}
