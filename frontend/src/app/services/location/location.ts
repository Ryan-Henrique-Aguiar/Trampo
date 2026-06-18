import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Estado {
  id: number;
  sigla: string;
  nome: string;
}

export interface Cidade {
  id: number;
  nome: string;
}

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private http = inject(HttpClient);
  private baseUrl = 'https://servicodados.ibge.gov.br/api/v1/localidades';

  getEstados(): Observable<Estado[]> {
    return this.http.get<Estado[]>(`${this.baseUrl}/estados?orderBy=nome`);
  }

  getCidades(estadoId: number): Observable<Cidade[]> {
    return this.http.get<Cidade[]>(`${this.baseUrl}/estados/${estadoId}/municipios?orderBy=nome`);
  }
}