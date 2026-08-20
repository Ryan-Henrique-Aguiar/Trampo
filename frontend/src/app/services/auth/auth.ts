import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { AuthResponseDto, UserDto } from '../../dto/auth/auth-response';
import { LoginRequestDto } from '../../dto/auth/login-request';
import { RegisterRequestDto } from '../../dto/auth/register-request.dto';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = `${environment.apiUrl}/auth`;

  private platformId = inject(PLATFORM_ID);

  currentUser: UserDto | null = this.getStoredUser();

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

  async register(dto: RegisterRequestDto): Promise<AuthResponseDto> {
    return await firstValueFrom(
      this.http.post<AuthResponseDto>(
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

  isLoggedIn(): boolean {
    if (!this.isBrowser()) return false;

    return !!localStorage.getItem('token');
  }

  isProvider(): boolean {
    return this.currentUser?.provider ?? false;
  }

  getToken(): string | null {
    if (!this.isBrowser()) return null;

    return localStorage.getItem('token');
  }

  private setSession(res: AuthResponseDto): void {
    this.currentUser = res.user;

    if (!this.isBrowser()) return;

    localStorage.setItem('token', res.token);
    localStorage.setItem(
      'user',
      JSON.stringify(res.user)
    );
  }

  private getStoredUser(): UserDto | null {
    if (!this.isBrowser()) return null;

    const raw = localStorage.getItem('user');

    return raw
      ? JSON.parse(raw)
      : null;
  }

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }
}
