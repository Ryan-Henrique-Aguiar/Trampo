import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom, Observable } from 'rxjs';
import { User } from '../../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private baseUrl = 'http://localhost:3000/users';

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
  ): Promise<User[]> {
    const params = new HttpParams()
      .set('isProvider', 'true')
      .set('isAvailableForUrgency', 'true')
      .set('state', state)
      .set('city', city);

    return await firstValueFrom(
      this.http.get<User[]>(this.baseUrl, { params })
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