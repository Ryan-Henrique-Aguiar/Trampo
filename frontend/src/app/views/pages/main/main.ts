import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

import { NotificationResponse } from '../../../dto/notification/notification-response';
import { AuthService } from '../../../services/auth/auth';
import { NotificationService } from '../../../services/notification/notification-service';
import { ViewMode, ViewModeService } from '../../../services/view-mode/view-mode-service';

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
  isHelpOpen = false;
  isNotificationsOpen = false;
  loadingNotifications = false;
  notificationsError: string | null = null;
  notifications: NotificationResponse[] = [];

  constructor(
    private authService: AuthService,
    private viewModeService: ViewModeService,
    private router: Router,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  get provider(): boolean {
    return this.authService.isProvider();
  }

  get name(): string | null {
    return this.authService.currentUser?.name ?? null;
  }

  get isProviderMode() {
    return this.viewModeService.isProviderMode;
  }

  ngOnInit(): void {
    this.loadNotifications();
  }

  setMode(mode: ViewMode): void {
    this.viewModeService.setMode(mode);
  }

  async toggleNotifications(): Promise<void> {
    this.isNotificationsOpen = !this.isNotificationsOpen;

    if (this.isNotificationsOpen) {
      await this.loadNotifications();
    }
  }

  async loadNotifications(): Promise<void> {
    this.loadingNotifications = true;
    this.notificationsError = null;

    try {
      this.notifications = await this.notificationService.getUnread();
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
      this.notifications = [];
      this.notificationsError = 'Não foi possível carregar as notificações.';
    } finally {
      this.loadingNotifications = false;
      this.cdr.detectChanges();
    }
  }

  async openNotification(notification: NotificationResponse): Promise<void> {
    try {
      await this.notificationService.markAsRead(notification.id);

      this.notifications = this.notifications.filter(
        item => item.id !== notification.id
      );

      this.isNotificationsOpen = false;
      this.cdr.detectChanges();

      await this.router.navigate(['/tickets']);
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
      this.notificationsError = 'Não foi possível abrir a notificação.';
      this.cdr.detectChanges();
    }
  }

  async clearAllNotifications(): Promise<void> {
    try {
      await this.notificationService.markAllAsRead();

      this.notifications = [];
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Erro ao limpar notificações:', error);
      this.notificationsError = 'Não foi possível limpar as notificações.';
      this.cdr.detectChanges();
    }
  }

  formatNotificationDate(date: string): string {
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  async logout(): Promise<void> {
    this.authService.logout();
    this.viewModeService.clear();
    await this.router.navigate(['/login']);
  }
}
