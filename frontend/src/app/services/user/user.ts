import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { User } from '../../models/user.model';
import { environment } from '../../../environments/environment';
import { UrgentProviderResponse } from '../../dto/user/urgent-provider-response';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private baseUrl = `${environment.devApiUrl}/users`;
  private apiUrl = `${environment.apiUrl}/user`;

  constructor(private http: HttpClient) {}

  async getById(id: number): Promise<User> {
    return await firstValueFrom(
      this.http.get<User>(`${this.baseUrl}/${id}`)
    )
  }

  async getProvidersWithUrgency(
    categoryId: number,
    state: string,
    city: string
  ): Promise<UrgentProviderResponse[]> {
    const params = new HttpParams()
      .set('categoryId', categoryId.toString())
      .set('state', state)
      .set('city', city);

    return await firstValueFrom(
      this.http.get<UrgentProviderResponse[]>(
        `${this.apiUrl}/providers/urgent`,
        { params }
      )
    );
  }

  async toggleUrgencyAvailability(
    userId: number,
    isAvailable: boolean
  ): Promise<User> {
    return await firstValueFrom(
      this.http.patch<User>(`${this.baseUrl}/${userId}`, {
        isAvailableForUrgency: isAvailable,
      })
    );
  }
}
