import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { MyProposalPage, Proposal } from '../../models/proposal.model';
import { CreateProposalRequest } from '../../dto/proposal/create-proposal-request';
import { environment } from '../../../environments/environment';
import { ProposalStatus } from '../../enums/proposal-status';

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

  async getMyProposals(statuses: ProposalStatus[], page = 0, size = 10): Promise<MyProposalPage> {
    let params = new HttpParams();
    for (const status of statuses) {
      params = params.append('status', status);
    }
    params = params.set('page', page.toString());
    params = params.set('size', size.toString());

    return firstValueFrom(
      this.http.get<MyProposalPage>(`${this.baseUrl}/my`, {
        params
      })
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
