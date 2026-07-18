// services/auth/auth.service.ts
import { Injectable, signal } from '@angular/core';

export interface User {
  id: number;
  name: string;
  email: string;
  type: 'client' | 'provider';
  categories?: number[];
  phone?: string;
  avatar?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userSignal = signal<User | null>(null);
  private tokenSignal = signal<string | null>(null);
  private loadingSignal = signal<boolean>(false);

  constructor() {
    // Inicializa com um usuário mock para desenvolvimento
    this.setMockUser();
  }

  // ============================================
  // GETTERS PÚBLICOS
  // ============================================

  /** Retorna o usuário atual ou null */
  get currentUser() {
    return this.userSignal();
  }

  /** Verifica se o usuário está autenticado */
  get isAuthenticated() {
    return this.userSignal() !== null;
  }

  /** Verifica se o usuário é um cliente */
  get isClient() {
    return this.userSignal()?.type === 'client';
  }

  /** Verifica se o usuário é um profissional */
  get isProvider() {
    return this.userSignal()?.type === 'provider';
  }

  /** Retorna o ID do usuário atual */
  get userId() {
    return this.userSignal()?.id;
  }

  /** Retorna as categorias do usuário (se for profissional) */
  get userCategories() {
    return this.userSignal()?.categories || [];
  }

  /** Retorna o token de autenticação */
  get token() {
    return this.tokenSignal();
  }

  /** Status de loading */
  get loading() {
    return this.loadingSignal();
  }

  // ============================================
  // MÉTODOS DE AUTENTICAÇÃO
  // ============================================

  /**
   * Realiza login do usuário
   */
  login(user: User, token: string): void {
    this.userSignal.set(user);
    this.tokenSignal.set(token);
  }

  /**
   * Realiza logout do usuário
   */
  logout(): void {
    this.userSignal.set(null);
    this.tokenSignal.set(null);
  }

  /**
   * Atualiza dados do usuário
   */
  updateUser(user: Partial<User>): void {
    const current = this.userSignal();
    if (current) {
      this.userSignal.set({ ...current, ...user });
    }
  }

  /**
   * Atualiza o tipo de usuário (cliente/profissional)
   */
  setUserType(type: 'client' | 'provider'): void {
    const current = this.userSignal();
    if (current) {
      this.userSignal.set({ ...current, type });
    }
  }

  /**
   * Define as categorias de atuação (para profissionais)
   */
  setCategories(categories: number[]): void {
    const current = this.userSignal();
    if (current) {
      this.userSignal.set({ ...current, categories });
    }
  }

  // ============================================
  // MÉTODOS DE VERIFICAÇÃO
  // ============================================

  /**
   * Verifica se o usuário é dono de um ticket
   */
  isOwner(ownerId: number): boolean {
    return this.userSignal()?.id === ownerId;
  }

  /**
   * Verifica se o usuário tem interesse em uma categoria
   */
  hasCategory(categoryId: number): boolean {
    return this.userCategories.includes(categoryId);
  }

  /**
   * Verifica se o usuário pode visualizar um ticket
   */
  canViewTicket(ticketOwnerId: number, ticketCategoryId: number): boolean {
    const user = this.userSignal();
    if (!user) return false;

    // Cliente só vê seus próprios tickets
    if (user.type === 'client') {
      return user.id === ticketOwnerId;
    }

    // Profissional vê tickets abertos das suas categorias
    if (user.type === 'provider') {
      return this.hasCategory(ticketCategoryId) && user.id !== ticketOwnerId;
    }

    return false;
  }

  // ============================================
  // MÉTODOS DE LOADING
  // ============================================

  setLoading(loading: boolean): void {
    this.loadingSignal.set(loading);
  }

  // ============================================
  // MÉTODO DE TESTE (trocar usuário aqui)
  // ============================================

  /**
   * Define um usuário mock para desenvolvimento
   * Altere o type para 'client' ou 'provider' para testar
   */
  setMockUser(): void {
    const mockUser: User = {
      id: 1,
      name: 'João Silva',
      email: 'joao@email.com',
      type: 'client', //Altere para 'provider' para testar como profissional
      categories: [1, 2, 3],
      phone: '(11) 99999-9999'
    };

    const mockToken = 'mock-jwt-token-12345';
    this.login(mockUser, mockToken);
  }
}