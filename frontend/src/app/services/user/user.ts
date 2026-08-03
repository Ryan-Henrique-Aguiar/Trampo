import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private baseUrl = 'http://localhost:3000/users';

  constructor(private http: HttpClient) {}

  getById(id: number): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/${id}`);
  }

  getProvidersWithUrgency(categoryId: number, state: string, city: string): Observable<User[]> {
    let params = new HttpParams()
      .set('isProvider', 'true')
      .set('isAvailableForUrgency', 'true') 
      .set('state', state)
      .set('city', city);

    return this.http.get<User[]>(this.baseUrl, { params });
  }

  toggleUrgencyAvailability(userId: number, isAvailable: boolean): Observable<User> {
    return this.http.patch<User>(`${this.baseUrl}/${userId}`, {
      isAvailableForUrgency: isAvailable,
    });
  }
}