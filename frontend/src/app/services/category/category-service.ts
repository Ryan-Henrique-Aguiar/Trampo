import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, Observable } from 'rxjs';
import { Category } from '../../models/category.model';
import { environment } from '../../../environments/environment.development';


@Injectable({ providedIn: 'root' })
export class CategoryService {
  private http = inject(HttpClient);

  private baseUrl = `http://localhost:8080/api/v1/categories`;

  async getAll(): Promise<Category[]> {
    return await firstValueFrom (
      this.http.get<Category[]>(this.baseUrl)
    )
  }

  getById(id: number): Observable<Category> {
    return this.http.get<Category>(`${this.baseUrl}/${id}`);
  }
}