import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { Proposal } from '../../models/proposal.model';
import { CreateProposalRequest } from '../../dto/proposal/create-proposal-request';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProposalService {

  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/proposals`;

  async getByTicketId(ticketId: number): Promise<Proposal[]> {
    return firstValueFrom(
      this.http.get<Proposal[]>(
        `${this.baseUrl}/ticket/${ticketId}`
      )
    );
  }

  async create(dto: CreateProposalRequest): Promise<Proposal> {
    return firstValueFrom(
      this.http.post<Proposal>(this.baseUrl, dto)
    );
  }

  async reject(proposalId: number): Promise<Proposal> {
    return firstValueFrom(
      this.http.patch<Proposal>(
        `${this.baseUrl}/${proposalId}/reject`,
        {}
      )
    );
  }

  async accept(proposalId: number): Promise<Proposal> {
    return firstValueFrom(
      this.http.patch<Proposal>(
        `${this.baseUrl}/${proposalId}/accept`,
        {}
      )
    );
  }
}
