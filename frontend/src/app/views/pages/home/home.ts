import { Component, computed, OnInit, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CategoryService } from '../../../services/category/category-service';
import { TicketService } from '../../../services/ticket/ticket-service';

import { Category } from '../../../models/category.model';
import { Ticket } from '../../../models/ticket.model';

import { TicketStatus } from '../../../enums/ticket-status';
import { TicketCard } from "../../../shared/components/ticket-card/ticket-card";
import { ActionCards, OpenTicketRequest } from "../../../shared/components/action-cards/action-cards";
import { TicketModal } from "../../../shared/components/ticket-modal/ticket-modal";
import { AuthService } from '../../../services/auth/auth';
import { ViewModeService } from '../../../services/view-mode/view-mode-service';

@Component({
  selector: 'app-home',
  imports: [RouterLink, TicketCard, ActionCards, TicketModal],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {

  categories = signal<Category[]>([]);
  tickets = signal<Ticket[]>([]);
  availableTickets = signal<Ticket[]>([]);

  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  // Estado do modal de criação de ticket, compartilhado entre
  // os action cards e os cards de categoria.
  isModalOpen = signal(false);
  isModalUrgent = signal(false);
  preselectedCategoryId = signal<number | null>(null);

  private categoryService = inject(CategoryService);
  private ticketService = inject(TicketService);
  private authService = inject(AuthService);
  private viewModeService = inject(ViewModeService);

  get isProvider() {
    return this.authService.isProvider;
  }

  get isClient() {
    return this.authService.isClient;
  }

  get currentUser() {
    return this.authService.currentUser;
  }

  get isProviderMode() {
    return this.viewModeService.isProviderMode;
  }

  ngOnInit(): void {
    if (this.authService.isProvider) {
      this.viewModeService.setMode('provider');
    }
    this.loadCategories();
    this.loadTickets();
  }

  private loadTickets(): void {
    const userId = this.authService.userId;
    if (userId === undefined) {
      this.error.set('Usuário não autenticado.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.ticketService.getTickets().subscribe({
      next: (myTickets) => {
        this.tickets.set(myTickets);

        if (this.authService.isProvider) {
          this.ticketService.getTickets({
            status: TicketStatus.OPEN,
            categoryId: this.authService.userCategories
          }).subscribe({
            next: (availableTickets) => {
              this.availableTickets.set(availableTickets);
              this.loading.set(false);
            },
            error: (err) => {
              console.error('Erro ao carregar tickets disponíveis:', err);
              this.availableTickets.set([]);
              this.loading.set(false);
            }
          });
        } else {
          this.loading.set(false);
        }
      },
      error: (err) => {
        console.error('Erro ao carregar seus tickets:', err);
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

  // Chamado pelo (openTicket) do ActionCards
  public onActionCardsOpenTicket(request: OpenTicketRequest): void {
    this.isModalUrgent.set(request.urgent);
    this.preselectedCategoryId.set(null);
    this.isModalOpen.set(true);
  }

  // Chamado pelo (click) de cada card de categoria
  public onCategoryClick(category: Category): void {
    this.isModalUrgent.set(false);
    this.preselectedCategoryId.set(category.id);
    this.isModalOpen.set(true);
  }

  public closeTicketModal(): void {
    this.isModalOpen.set(false);
  }

  firstThreeMyTickets = computed(() => this.tickets().slice(0, 3));
  firstThreeCategories = computed(() => this.categories().slice(0, 3));
  firstThreeAvailableTickets = computed(() => this.availableTickets().slice(0, 3));

  getStatusLabel(status: TicketStatus): string {
    const labels: Record<TicketStatus, string> = {
      [TicketStatus.OPEN]: 'Aberto',
      [TicketStatus.IN_PROGRESS]: 'Em andamento',
      [TicketStatus.COMPLETED]: 'Finalizado',
      [TicketStatus.CANCELLED]: 'Cancelado'
    };
    return labels[status] || status;
  }
}