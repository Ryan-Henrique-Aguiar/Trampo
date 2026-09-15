import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UrgentProviderResponse } from '../../dto/user/urgent-provider-response';
import { UrgencyAvailability } from '../../dto/user/urgency-availability';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/user`;

  constructor(private http: HttpClient) {}


  getProvidersWithUrgency(
    categoryId: number,
    state: string,
    city: string
  ): Promise<UrgentProviderResponse[]> {
    const params = new HttpParams()
      .set('categoryId', categoryId.toString())
      .set('state', state)
      .set('city', city);

    return firstValueFrom(
      this.http.get<UrgentProviderResponse[]>(
        `${this.apiUrl}/providers/urgent`,
        { params }
      )
    );
  }

  getAvailableUrgentProvidersCount(): Promise<number> {
    return firstValueFrom(
      this.http.get<number>(`${this.apiUrl}/providers/urgent/count`)
    );
  }

  toggleUrgencyAvailability(
    isAvailable: boolean
  ): Promise<UrgencyAvailability> {
    return firstValueFrom(
      this.http.patch<UrgencyAvailability>(`${this.apiUrl}/urgency`, {
        availableForUrgency: isAvailable,
      })
    );
  }
}
