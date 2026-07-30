import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BrasilApiCepResponse } from '../../models/brasil-api-cep-response.model';

@Injectable({
  providedIn: 'root',
})
export class CepBrasilApiService {
  private readonly baseUrl = 'https://brasilapi.com.br/api/cep/v2';

  constructor(private http: HttpClient) {}

  getCep(cep: string): Observable<BrasilApiCepResponse> {
    return this.http.get<BrasilApiCepResponse>(`${this.baseUrl}/${cep}`);
  }
}