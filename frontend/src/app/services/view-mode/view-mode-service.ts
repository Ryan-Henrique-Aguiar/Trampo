import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type ViewMode = 'client' | 'provider';

@Injectable({
  providedIn: 'root'
})
export class ViewModeService {
  private platformId = inject(PLATFORM_ID);
  mode: ViewMode = 'client';

  get isProviderMode(): boolean {
    return this.mode === 'provider';
  }

  setMode(mode: ViewMode): void {
    this.mode = mode;
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('viewMode', mode);
    }
  }

  initialize(provider: boolean): void {
    if (!isPlatformBrowser(this.platformId)) return;

    if (!provider) {
      this.mode = 'client';
      return;
    }

    const savedMode = localStorage.getItem('viewMode');
    this.mode = savedMode === 'client' || savedMode === 'provider'
      ? savedMode
      : 'provider';
  }

  clear(): void {
    this.mode = 'client';
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('viewMode');
    }
  }
}
