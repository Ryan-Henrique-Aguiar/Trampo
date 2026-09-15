import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Category } from '../../models/category.model';
import { environment } from '../../../environments/environment';


@Injectable({ providedIn: 'root' })
export class CategoryService {
  private baseUrl = `${environment.apiUrl}/categories`;

  constructor(private http: HttpClient) {}

  getAll(): Promise<Category[]> {
    return firstValueFrom(
      this.http.get<Category[]>(this.baseUrl)
    );
  }
}
