import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface State {
  id: number;
  uf: string;
  name: string;
}

export interface City {
  id: number;
  name: string;
}

export interface BrasilApiCepResponse {
  cep: string;
  state: string;
  city: string;
  neighborhood: string;
  street: string;
  service: string;
}

@Injectable({
  providedIn: 'root'
})
export class LocationService {

  private readonly baseUrl = 'https://brasilapi.com.br/api';

  constructor(private http: HttpClient) {}

  async getCep(cep: string): Promise<BrasilApiCepResponse> {
    return await firstValueFrom(
      this.http.get<BrasilApiCepResponse>(
        `${this.baseUrl}/cep/v2/${cep}`
      )
    );
  }

  async getStates(): Promise<State[]> {
    const states = await firstValueFrom(
      this.http.get<any[]>(
        `${this.baseUrl}/ibge/uf/v1`
      )
    );

    return states.map(state => ({
      id: state.id,
      uf: state.sigla,
      name: state.nome
    }));
  }

  async getCities(uf: string): Promise<City[]> {
    const cities = await firstValueFrom(
      this.http.get<any[]>(
        `${this.baseUrl}/ibge/municipios/v1/${uf}`
      )
    );

    return cities.map(city => ({
      id: Number(city.codigo_ibge),
      name: city.nome
    }));
  }
}