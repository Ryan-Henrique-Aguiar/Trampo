import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Review, ReviewStatus } from '../../models/review.model';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private apiUrl = `${environment.apiUrl}/reviews`;

  constructor(private http: HttpClient) {}

  create(ticketId: number, score: number, comment: string): Promise<Review> {
    return firstValueFrom(
      this.http.post<Review>(`${this.apiUrl}/tickets/${ticketId}`, {
        score,
        comment
      })
    );
  }

  getStatus(ticketId: number): Promise<ReviewStatus> {
    return firstValueFrom(
      this.http.get<ReviewStatus>(`${this.apiUrl}/tickets/${ticketId}/status`)
    );
  }

  getByUserId(userId: number): Promise<Review[]> {
    return firstValueFrom(
      this.http.get<Review[]>(`${this.apiUrl}/users/${userId}`)
    );
  }
}
