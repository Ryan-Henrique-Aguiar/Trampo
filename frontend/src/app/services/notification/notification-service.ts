import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { NotificationResponse } from '../../dto/notification/notification-response';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = `${environment.apiUrl}/notification`;

  constructor(private http: HttpClient) {}

  getUnread(): Promise<NotificationResponse[]> {
    return firstValueFrom(
      this.http.get<NotificationResponse[]>(`${this.apiUrl}/unread`)
    );
  }
  markAsRead(id: number): Promise<void> {
    return firstValueFrom(
      this.http.put<void>(`${this.apiUrl}/${id}/read`, {})
    );
  }

  markAllAsRead(): Promise<void> {
    return firstValueFrom(
      this.http.put<void>(`${this.apiUrl}/read-all`, {})
    );
  }
}
