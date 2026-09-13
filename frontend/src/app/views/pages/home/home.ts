import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CategoryService } from '../../../services/category/category-service';
import { TicketService } from '../../../services/ticket/ticket-service';

import { Category } from '../../../models/category.model';
import { GroupedTickets, Ticket } from '../../../models/ticket.model';

import { TicketCard } from "../../../shared/components/ticket-card/ticket-card";
import { TicketModal } from "../../../shared/components/ticket-modal/ticket-modal";
import { AuthService } from '../../../services/auth/auth';
import { ViewModeService } from '../../../services/view-mode/view-mode-service';
import { TicketDetail } from "../../../shared/components/ticket-detail/ticket-detail";
import { ProposalsModal } from "../../../shared/components/proposal-modal/proposal-modal";
import { UserService } from '../../../services/user/user';
import { ToastrService } from '@iqx-limited/ngx-toastr';

@Component({
  selector: 'app-home',
  imports: [RouterLink, TicketCard, TicketModal, TicketDetail, ProposalsModal],
  templateUrl: './home.html',
  styleUrl: './home.css',
})

export class Home implements OnInit, OnDestroy {

  categories: Category[] = [];
  tickets: Ticket[] = [];
  availableTickets: Ticket[] = [];
  availableUrgentProviders = 0;

  groupedTickets: GroupedTickets[] = [];
  activeTickets: Ticket[] = [];

  loadingMyTickets = false;
  loadingAvailableTickets = false;
  loadingCategories = false;
  myTicketsError: string | null = null;
  availableTicketsError: string | null = null;
  categoriesError: string | null = null;

  activeModal: 'create' | 'details' | 'proposals' | null = null;
  isModalUrgent = false
  preselectedCategoryId: number | null = null;
  selectedTicket: Ticket | null = null;
  updatingUrgency = false;

  // Variáveis para o drag-to-scroll
  isDragging = false;
  startX = 0;
  scrollLeft = 0;
  private hasMoved = false; // Identifica se o usuário realmente arrastou


  private urgentProvidersInterval: ReturnType<typeof setInterval> | null = null;


  constructor(
    private categoryService: CategoryService,
    private ticketService: TicketService,
    private authService: AuthService,
    private viewModeService: ViewModeService,
    private userService: UserService,
    private toastrService: ToastrService,
    private cdr: ChangeDetectorRef
  ) {

  }

  get currentUser() {
    return this.authService.currentUser;
  }

  get isProviderMode() {
    return this.viewModeService.isProviderMode;
  }

  ngOnInit(): void {
    this.loadMyTickets();
    if (this.authService.isProvider()) {
      this.loadAvailableTickets();
    }
    this.loadCategories();
    this.loadAvailableUrgentProvidersCount();
    this.urgentProvidersInterval = setInterval(
      () => this.loadAvailableUrgentProvidersCount(),
      5 * 60 * 1000
    );
  }

  ngOnDestroy(): void {
    if (this.urgentProvidersInterval) {
      clearInterval(this.urgentProvidersInterval);
    }
  }

  private buildGroupedTickets(): void {
  // Evita processar se os tickets ainda não chegaram
  if (!this.availableTickets || this.availableTickets.length === 0) {
    this.groupedTickets = [];
    return;
  }

  const groups = new Map<string, GroupedTickets>();

  this.availableTickets.forEach(ticket => {
    // Cruza o categoryId do ticket com o array de categorias já carregado
    const categoryMatch = this.categories.find(c => c.id === ticket.categoryId);
    const catName = categoryMatch ? categoryMatch.name : 'Outros Serviços';
    
    if (!groups.has(catName)) {
      groups.set(catName, { 
        categoryName: catName, 
        categoryId: ticket.categoryId,
        tickets: [] 
      });
    }
    
    groups.get(catName)!.tickets.push(ticket);
  });

  this.groupedTickets = Array.from(groups.values());
  }

private filterAndSortMyTickets(): void {
  if (!this.tickets || this.tickets.length === 0) {
    this.activeTickets = [];
    return;
  }

  this.activeTickets = this.tickets
    // Filtra apenas os status desejados
    .filter(ticket => ticket.status === 'OPEN' || ticket.status === 'IN_PROGRESS')
    // Ordena por data de criação (mais recentes primeiro)
    .sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });
  }

  private async loadAvailableUrgentProvidersCount(): Promise<void> {
    try {
      this.availableUrgentProviders =
        await this.userService.getAvailableUrgentProvidersCount();
    } catch (err) {
      console.error('Erro ao carregar prestadores disponíveis:', err);
      this.availableUrgentProviders = 0;
    } finally {
      this.cdr.detectChanges();
    }
  }

  private async loadMyTickets(): Promise<void> {
    this.loadingMyTickets = true;
    this.myTicketsError = null;

    try {
      this.tickets =
        await this.ticketService.getMyTickets();
        this.filterAndSortMyTickets();
    } catch (err) {
      console.error(
        'Erro ao carregar tickets do usuário:',
        err
      );
      this.tickets = [];
      this.myTicketsError =
        'Não foi possível carregar seus serviços.';
    } finally {
      this.loadingMyTickets = false;
      
      this.cdr.detectChanges();
    }
  }

  private async loadAvailableTickets(): Promise<void> {
    this.loadingAvailableTickets = true;
    this.availableTicketsError = null;
    

    try {
      this.availableTickets =
        await this.ticketService.getAvailableTickets();
        this.buildGroupedTickets();
    } catch (err) {
      console.error(
        'Erro ao carregar tickets disponíveis:',
        err
      );
      this.availableTickets = [];
      this.availableTicketsError =
        'Não foi possível carregar os serviços disponíveis.';
    } finally {
      this.loadingAvailableTickets = false;
      this.cdr.detectChanges();
    }
  }

  private async loadCategories(): Promise<void> {
    this.loadingCategories = true;
    this.categoriesError = null;

    try {
      this.categories =
        await this.categoryService.getAll();
        this.buildGroupedTickets();
    } catch (err) {
      console.error(
        'Erro ao carregar categorias:',
        err
      );
      this.categories = [];
      this.categoriesError =
        'Não foi possível carregar as categorias.';
    } finally {
      this.loadingCategories = false;
      this.cdr.detectChanges();
    }
  }

  // ===== MODAL DE DETALHES =====

  openTicketDetail(ticket: Ticket): void {
    this.selectedTicket = ticket;
    this.activeModal = 'details';
  }

  onTicketUpdated(updatedTicket: Ticket): void {
    this.tickets = this.tickets.map(ticket =>
      ticket.id === updatedTicket.id
        ? updatedTicket
        : ticket
    )
    this.availableTickets = this.availableTickets.map(ticket =>
      ticket.id === updatedTicket.id
        ? updatedTicket
        : ticket
    );
  
    this.buildGroupedTickets();
    this.filterAndSortMyTickets();
    this.selectedTicket = updatedTicket;
    this.cdr.detectChanges();
  }

  // ===== MODAL DE PROPOSTAS (novo) =====

  openProposalsModal(ticket: Ticket): void {
    this.selectedTicket = ticket;
    this.activeModal = 'proposals';
  }

  // ===== MODAL DE CRIAÇÃO =====

  openTicketModal(isUrgent: boolean, categoryId: number | null = null): void {
    this.isModalUrgent = isUrgent;
    this.preselectedCategoryId = categoryId;
    this.activeModal = 'create';
  }

  closeModal(): void {
    this.activeModal = null;
    this.selectedTicket = null;
    this.isModalUrgent = false;
    this.preselectedCategoryId = null;
  }


  onTicketCreated(ticket: Ticket): void {
    this.tickets = [ticket, ...this.tickets];
    this.cdr.detectChanges();
  }
  

  async toggleUrgencyAvailability(): Promise<void> {
    if (!this.currentUser || this.updatingUrgency) return;

    this.updatingUrgency = true;
    const available = !this.currentUser.availableForUrgency;

    try {
      const response =
        await this.userService.toggleUrgencyAvailability(available);
      this.currentUser.availableForUrgency = response.availableForUrgency;
      this.toastrService.success(
        available
          ? 'Modo urgente ativado'
          : 'Modo urgente desativado'
      );
    } catch {
      this.toastrService.error('Não foi possível alterar o modo urgente');
    } finally {
      this.updatingUrgency = false;
      this.cdr.detectChanges();
    }
  }

  // Função para as setas de navegação
  scrollCarousel(carousel: HTMLElement, direction: number): void {
    // Rola cerca de 320px (tamanho aproximado de um card)
    const scrollAmount = 320; 
    carousel.scrollBy({ left: scrollAmount * direction, behavior: 'smooth' });
  }

  // ===== EVENTOS DE MOUSE PARA ARRASTAR =====

  onMouseDown(event: MouseEvent, carousel: HTMLElement): void {
    this.isDragging = true;
    this.hasMoved = false; // Reseta no início do clique
    this.startX = event.pageX - carousel.offsetLeft;
    this.scrollLeft = carousel.scrollLeft;
  }

  onMouseMove(event: MouseEvent, carousel: HTMLElement): void {
    if (!this.isDragging) return;

    const x = event.pageX - carousel.offsetLeft;
    const walk = x - this.startX;

    // Se o usuário moveu o mouse mais de 5 pixels, consideramos um ARRASTO
    if (Math.abs(walk) > 5) {
      this.hasMoved = true;
      carousel.classList.add('is-dragging-active');
      event.preventDefault();
      carousel.scrollLeft = this.scrollLeft - (walk * 1.5);
    }
  }

  onMouseUp(): void {
    this.isDragging = false;
    // Pequeno atraso para liberar os cliques caso tenha sido um arrasto
    setTimeout(() => {
      this.hasMoved = false;
    }, 50);
  }

  onMouseLeave(): void {
    this.isDragging = false;
    this.hasMoved = false;
  }
  

  

}
