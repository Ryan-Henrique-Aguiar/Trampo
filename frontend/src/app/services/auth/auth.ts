import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { AuthResponseDto, UserDto } from '../../dto/auth/auth-response';
import { LoginRequestDto } from '../../dto/auth/login-request';
import { RegisterRequestDto } from '../../dto/auth/register-request.dto';
import { RegisterResponseDto } from '../../dto/auth/register-response.dto';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = `${environment.apiUrl}/auth`;

  private platformId = inject(PLATFORM_ID);

  currentUser: UserDto | null = null;
  
  constructor(private http: HttpClient) {}

  async login(dto: LoginRequestDto): Promise<AuthResponseDto> {
    const res = await firstValueFrom(
      this.http.post<AuthResponseDto>(
        `${this.apiUrl}/login`,
        dto
      )
    );

    this.setSession(res);

    return res;
  }
  
  async register(dto: RegisterRequestDto): Promise<RegisterResponseDto> {
    return await firstValueFrom(
      this.http.post<RegisterResponseDto>(
        `${this.apiUrl}/register`,
        dto
      )
    );
  }

  logout(): void {
    if (!this.isBrowser()) return;

    localStorage.removeItem('token');
    localStorage.removeItem('user');

    this.currentUser = null;
  }

  async validateSession(): Promise<boolean> {
    if (!this.isBrowser()) return false;

    localStorage.removeItem('user');

    const token = this.getToken();

    if (!token || this.isTokenExpired(token)) {
      this.logout();
      return false;
    }

    try {
      this.currentUser = await firstValueFrom(
        this.http.get<UserDto>(`${this.apiUrl}/me`)
      );
      return true;
    } catch {
      this.logout();
      return false;
    }
  }

  private isTokenExpired(token: string): boolean {
    try {
      const base64 = token
        .split('.')[1]
        .replace(/-/g, '+')
        .replace(/_/g, '/');

      const padded = base64.padEnd(
        Math.ceil(base64.length / 4) * 4,
        '='
      );

      const payload = JSON.parse(atob(padded));

      return !payload.exp || payload.exp * 1000 <= Date.now();
    } catch {
      return true;
    }
  }

  isProvider(): boolean {
    return this.currentUser?.provider ?? false;
  }

  getToken(): string | null {
    if (!this.isBrowser()) return null;

    return localStorage.getItem('token');
  }

  private setSession(res: AuthResponseDto): void {
    if (!this.isBrowser()) return;

    localStorage.removeItem('user');
    localStorage.setItem('token', res.token);
  }

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }
}
