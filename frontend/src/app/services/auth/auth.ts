import { Injectable, signal } from '@angular/core';
import { User } from '../../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userSignal = signal<User | null>(null);

  constructor() {
    this.setMockUser();
  }

  get currentUser() {
    return this.userSignal();
  }

  get isClient() {
    return true;
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
  }

  /** Troque isProvider e categoryIds pra testar cada cenário */
  setMockUser(): void {
    const mockUser: User = {
      id: 2,
      name: 'Luciano tiburcio',
      email: 'joao@email.com',
      cpf: '22222222222',
      password: '123456',
      isProvider: false,
      categoryIds: [1],
    };

    this.login(mockUser);
  }
}