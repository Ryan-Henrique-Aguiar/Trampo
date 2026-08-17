import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { Proposal } from '../../models/proposal.model';
import { CreateProposalRequest } from '../../dto/proposal/create-proposal-request';
import { ProposalStatus } from '../../enums/proposal-status';
import { environment } from '../../../environments/environment.development';
import { AuthService } from '../auth/auth';

@Injectable({
  providedIn: 'root'
})
export class ProposalService {

  private http = inject(HttpClient);
  private authService = inject(AuthService);

  private baseUrl = `${environment.apiUrl}/proposals`;

  async getByTicketId(ticketId: number): Promise<Proposal[]> {
    return await firstValueFrom(
      this.http.get<Proposal[]>(
        `${this.baseUrl}?ticketId=${ticketId}`
      )
    );
  }

  async create(dto: CreateProposalRequest): Promise<Proposal> {
    const payload = {
      priceRange: dto.priceRange,
      ticketId: dto.ticketId,
      professionalId: this.authService.currentUser?.id,
      status: ProposalStatus.PENDING,
    };

    return await firstValueFrom(
      this.http.post<Proposal>(this.baseUrl, payload)
    );
  }

  async reject(proposal: Proposal): Promise<Proposal> {
    return await firstValueFrom(
      this.http.patch<Proposal>(
        `${this.baseUrl}/${proposal.id}`,
        { status: ProposalStatus.REJECTED }
      )
    );
  }

  async accept(proposal: Proposal): Promise<Proposal> {
    return await firstValueFrom(
      this.http.patch<Proposal>(
        `${this.baseUrl}/${proposal.id}`,
        { status: ProposalStatus.ACCEPTED }
      )
    );
  }
}