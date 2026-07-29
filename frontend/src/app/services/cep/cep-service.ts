import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ViaCepResponse } from '../../models/via-cep-response-model';

@Injectable({
  providedIn: 'root'
})
export class CepService {
  private http = inject(HttpClient);
  private baseUrl = 'https://viacep.com.br/ws';

  getCep(cep: string): Observable<ViaCepResponse> {
    const cleanCep = cep.replace(/\D/g, '');// remove tudo q não for digito.

    return this.http.get<ViaCepResponse>(`${this.baseUrl}/${cleanCep}/json/`).pipe(
      map(response => {
        if (response.erro) {
          throw new Error('CEP não encontrado');
        }
        return response;
      })
    );
  }
}