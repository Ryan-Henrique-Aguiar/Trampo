import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Proposal } from '../../models/proposal.model';
import { CreateProposalRequest } from '../../dto/proposal/create-proposal-request';
import { ProposalStatus } from '../../enums/proposal-status';
import { environment } from '../../../environments/environment.development';
import { AuthService } from '../auth/auth';

@Injectable({ providedIn: 'root' })
export class ProposalService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private baseUrl = `${environment.apiUrl}/proposals`;

  getByTicketId(ticketId: number): Observable<Proposal[]> {
    return this.http.get<Proposal[]>(`${this.baseUrl}?ticketId=${ticketId}`);
  }

  create(dto: CreateProposalRequest): Observable<Proposal> {
    const payload = {
      priceRange: dto.priceRange,
      ticketId: dto.ticketId,
      professionalId: this.authService.userId,
      status: ProposalStatus.PENDING,
    };
    return this.http.post<Proposal>(this.baseUrl, payload);
  }

  reject(proposal: Proposal): Observable<Proposal> {
    return this.http.patch<Proposal>(`${this.baseUrl}/${proposal.id}`, { status: ProposalStatus.REJECTED });
  }

  accept(proposal: Proposal): Observable<Proposal> {
    return this.http.patch<Proposal>(`${this.baseUrl}/${proposal.id}`, { status: ProposalStatus.ACCEPTED });
  }
}