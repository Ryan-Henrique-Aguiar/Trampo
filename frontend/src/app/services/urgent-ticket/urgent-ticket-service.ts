import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { CreateUrgentTicketRequest } from '../../dto/urgent-ticket/create-urgent-ticket-request';
import { UrgentTicket } from '../../models/ticket.model';

@Injectable({ providedIn: 'root' })
export class UrgentTicketService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/urgenttickets`;

  async getMyUrgentTickets(page = 0, size = 5): Promise<{ content: UrgentTicket[]; hasNext: boolean }> {
    return firstValueFrom(this.http.get<{ content: UrgentTicket[]; hasNext: boolean }>(this.baseUrl, {
      params: { page, size }
    }));
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
