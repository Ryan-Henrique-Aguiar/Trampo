import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type ViewMode = 'client' | 'provider';

@Injectable({
  providedIn: 'root'
})
export class ViewModeService {
  private platformId = inject(PLATFORM_ID);
  private userId: number | null = null;
  private modeSignal = signal<ViewMode>('client');

  get mode() {
    return this.modeSignal();
  }

  get isProviderMode() {
    return this.modeSignal() === 'provider';
  }

  setMode(mode: ViewMode): void {
    this.modeSignal.set(mode);
    if (isPlatformBrowser(this.platformId) && this.userId !== null) {
      localStorage.setItem('viewMode', mode);
    }
  }

  initializeForUser(userId: number, provider: boolean): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const savedUserId = localStorage.getItem('viewModeUserId');
    const savedMode = localStorage.getItem('viewMode');
    this.userId = userId;

    const mode = provider
      ? (savedUserId === String(userId) && savedMode === 'client' ? 'client' : 'provider')
      : 'client';

    this.setMode(mode);
    localStorage.setItem('viewModeUserId', String(userId));
  }

  clear(): void {
    this.userId = null;
    this.modeSignal.set('client');
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('viewMode');
      localStorage.removeItem('viewModeUserId');
    }
  }
}
