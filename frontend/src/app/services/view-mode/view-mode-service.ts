import { Injectable, signal } from '@angular/core';

export type ViewMode = 'client' | 'provider';

@Injectable({
  providedIn: 'root'
})
export class ViewModeService {
  private modeSignal = signal<ViewMode>('client');

  get mode() {
    return this.modeSignal();
  }

  get isProviderMode() {
    return this.modeSignal() === 'provider';
  }

  setMode(mode: ViewMode): void {
    this.modeSignal.set(mode);
  }

  toggle(): void {
    this.modeSignal.set(this.modeSignal() === 'client' ? 'provider' : 'client');
  }
}