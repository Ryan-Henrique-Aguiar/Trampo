import { Injectable, signal, inject } from '@angular/core';
import { User } from '../../models/user.model';
import { UserService } from '../user/user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userService = inject(UserService);
  private userSignal = signal<User | null>(null);
  private loadingSignal = signal(true);

  constructor() {
    // Troque o id aqui pra testar como cliente (1) ou prestador (2)
    this.setMockUser(1);
  }

  get currentUser() {
    return this.userSignal();
  }

  get isLoadingUser() {
    return this.loadingSignal();
  }

  get isClient() {
    return !this.userSignal()?.isProvider;
  }

  get isProvider() {
    return this.userSignal()?.isProvider ?? false;
  }

  get userId() {
    return this.userSignal()?.id;
  }

  get userCategories() {
    return this.userSignal()?.categoryIds || [];
  }

  isOwner(ownerId: number): boolean {
    return this.userSignal()?.id === ownerId;
  }

  hasCategory(categoryId: number): boolean {
    return this.userCategories.includes(categoryId);
  }

  private login(user: User): void {
    this.userSignal.set(user);
    this.loadingSignal.set(false);
  }

  /** Busca o usuário real do db.json e "loga" com ele */
  setMockUser(id: number): void {
    this.loadingSignal.set(true);
    this.userService.getById(id).subscribe({
      next: (user) => this.login(user),
      error: (err) => {
        console.error('Erro ao carregar mock user:', err);
        this.loadingSignal.set(false);
      },
    });
  }
}