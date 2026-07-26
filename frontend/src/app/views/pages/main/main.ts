import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../services/auth/auth';
import { ViewModeService } from '../../../services/view-mode/view-mode-service';

@Component({
  selector: 'app-main',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './main.html',
  styleUrl: './main.css',
})
export class Main implements OnInit {
  name: string | null = null;

  private authService = inject(AuthService);
  private viewModeService = inject(ViewModeService);

  isHelpOpen = false;

  get isProvider() {
    return this.authService.isProvider;
  }

  get isProviderMode() {
    return this.viewModeService.isProviderMode;
  }

  ngOnInit(): void {
    this.name = this.authService.currentUser?.name ?? null;
  }

  toggleMode(): void {
    this.viewModeService.toggle();
  }
}