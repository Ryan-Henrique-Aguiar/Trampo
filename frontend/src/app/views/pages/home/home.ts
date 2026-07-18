import { Component, computed, OnInit, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CategoryService } from '../../../services/category/category-service';
import { TicketService } from '../../../services/ticket/ticket-service';

import { Category } from '../../../models/category.model';
import { Ticket } from '../../../models/ticket.model';

import { TicketStatus } from '../../../enums/ticket-status';
import { TicketCard } from "../../../shared/components/ticket-card/ticket-card";
import { ActionCards } from "../../../shared/components/action-cards/action-cards";
import { AuthService } from '../../../services/auth/auth';

interface User {
  id: number;
  name: string;
  type: 'client' | 'provider';
  categories?: number[]; 
}

@Component({
  selector: 'app-home',
  imports: [RouterLink, TicketCard, ActionCards],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {

  categories = signal<Category[]>([]);
  tickets = signal<Ticket[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  private categoryService = inject(CategoryService);
  private ticketService = inject(TicketService);
  private authService = inject(AuthService);

  // Computed para usar no template
  get isProvider() {
    return this.authService.isProvider;
  }

  get isClient() {
    return this.authService.isClient;
  }

  get currentUser() {
    return this.authService.currentUser;
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadTickets();
  }

  private loadTickets(): void {
    this.loading.set(true);
    this.error.set(null);
    
    this.ticketService.getAll().subscribe({
      next: (tickets) => {
        let filteredTickets: Ticket[] = [];

        if (this.authService.isProvider) {
          // PROFISSIONAL: Vê tickets abertos das suas categorias (exceto os próprios)
          filteredTickets = tickets.filter(t => 
            t.status === TicketStatus.OPEN && 
            this.authService.hasCategory(t.categoryId) &&
            !this.authService.isOwner(t.userId) // Não mostra os próprios tickets
          );
          console.log(`Tickets disponíveis para o profissional: ${filteredTickets.length}`);
        } else {
          // CLIENTE (usuário comum): Vê apenas os tickets que ele criou
          filteredTickets = tickets.filter(t => 
            t.userId === this.authService.userId
          );
          console.log(`Tickets do cliente: ${filteredTickets.length}`);
        }

        this.tickets.set(filteredTickets);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar tickets:', err);
        this.error.set('Erro ao carregar tickets.');
        this.tickets.set([]);
        this.loading.set(false);
      }
    });
  }

  private loadCategories(): void {
    this.categoryService.getAll().subscribe({
      next: (categories) => {
        this.categories.set(categories);
      },
      error: (err) => {
        console.error('Erro ao carregar categorias:', err);
        this.categories.set([]);
      }
    });
  }

  // Computed: Primeiros 3 tickets (já filtrados)
  firstThreeTickets = computed(() => {
    const allTickets = this.tickets();
    return allTickets.slice(0, 3);
  });

  // Computed: Primeiras 3 categorias
  firstThreeCategories = computed(() => {
    const allCategories = this.categories();
    return allCategories.slice(0, 3);
  });

  getStatusLabel(status: TicketStatus): string {
    const labels: Record<TicketStatus, string> = {
      [TicketStatus.OPEN]: 'Aberto',
      [TicketStatus.WITH_PROPOSALS]: 'Com propostas',
      [TicketStatus.IN_PROGRESS]: 'Em andamento',
      [TicketStatus.COMPLETED]: 'Finalizado',
      [TicketStatus.CANCELLED]: 'Cancelado'
    };
    return labels[status] || status;
  }

}