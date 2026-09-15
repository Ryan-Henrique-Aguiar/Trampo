import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type ViewMode = 'client' | 'provider';

@Injectable({
  providedIn: 'root'
})
export class ViewModeService {
  private platformId = inject(PLATFORM_ID);
  private mode = signal<ViewMode>('client');

  get isProviderMode(): boolean {
    return this.mode() === 'provider';
  }

  setMode(mode: ViewMode): void {
    this.mode.set(mode);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('viewMode', mode);
    }
  }

  initialize(provider: boolean): void {
    if (!isPlatformBrowser(this.platformId)) return;

    if (!provider) {
      this.mode.set('client');
      return;
    }

    const savedMode = localStorage.getItem('viewMode');
    const initialMode = savedMode === 'client' || savedMode === 'provider'
      ? savedMode
      : 'provider';

    this.mode.set(initialMode);
  }

  clear(): void {
    this.mode.set('client');
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('viewMode');
    }
  }
}
