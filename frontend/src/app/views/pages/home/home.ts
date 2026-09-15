import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CategoryService } from '../../../services/category/category-service';
import { TicketService } from '../../../services/ticket/ticket-service';

import { Category } from '../../../models/category.model';
import { GroupedTickets, Ticket } from '../../../models/ticket.model';
import { TicketStatus } from '../../../enums/ticket-status';

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
  groupedTickets: GroupedTickets[] = [];
  availableUrgentProviders = 0;

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
  isDragging = false;
  startX = 0;
  scrollLeft = 0;

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

  private groupAvailableTickets(): void {
    const groups: GroupedTickets[] = [];

    for (const ticket of this.availableTickets) {
      const category = this.categories.find(
        item => item.id === ticket.categoryId
      );
      const categoryName = category?.name ?? 'Outros serviços';
      let group = groups.find(item => item.categoryName === categoryName);

      if (!group) {
        group = { categoryName, tickets: [] };
        groups.push(group);
      }

      group.tickets.push(ticket);
    }

    this.groupedTickets = groups;
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
      const response = await this.ticketService.getMyTickets(
        [TicketStatus.OPEN, TicketStatus.IN_PROGRESS],
        0,
        10
      );
      this.tickets = response.content;
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
      const response = await this.ticketService.getAvailableTickets(undefined, 0, 10);
      this.availableTickets = response.content;
      this.groupAvailableTickets();
    } catch (err) {
      console.error(
        'Erro ao carregar tickets disponíveis:',
        err
      );
      this.availableTickets = [];
      this.groupAvailableTickets();
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
      this.groupAvailableTickets();
    } catch (err) {
      console.error(
        'Erro ao carregar categorias:',
        err
      );
      this.categories = [];
      this.groupAvailableTickets();
      this.categoriesError =
        'Não foi possível carregar as categorias.';
    } finally {
      this.loadingCategories = false;
      this.cdr.detectChanges();
    }
  }

  openTicketDetail(ticket: Ticket): void {
    this.selectedTicket = ticket;
    this.activeModal = 'details';
  }

  onTicketUpdated(updatedTicket: Ticket): void {
    this.selectedTicket = updatedTicket;
    if (this.isProviderMode) {
      this.loadAvailableTickets();
    } else {
      this.loadMyTickets();
    }
  }

  openProposalsModal(ticket: Ticket): void {
    this.selectedTicket = ticket;
    this.activeModal = 'proposals';
  }

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
    this.tickets = [ticket, ...this.tickets].slice(0, 10);
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

  scrollCarousel(carousel: HTMLElement, direction: number): void {
    carousel.scrollBy({ left: 320 * direction, behavior: 'smooth' });
  }

  onMouseDown(event: MouseEvent, carousel: HTMLElement): void {
    this.isDragging = true;
    this.startX = event.pageX - carousel.offsetLeft;
    this.scrollLeft = carousel.scrollLeft;
  }

  onMouseMove(event: MouseEvent, carousel: HTMLElement): void {
    if (!this.isDragging) return;

    const x = event.pageX - carousel.offsetLeft;
    const walk = x - this.startX;

    if (Math.abs(walk) > 5) {
      event.preventDefault();
      carousel.scrollLeft = this.scrollLeft - (walk * 1.5);
    }
  }

  onMouseUp(): void {
    this.isDragging = false;
  }

  onMouseLeave(): void {
    this.isDragging = false;
  }

}
