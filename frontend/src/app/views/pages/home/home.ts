import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CategoryService } from '../../../services/category/category-service';
import { TicketService } from '../../../services/ticket/ticket-service';

import { Category } from '../../../models/category.model';
import { Ticket } from '../../../models/ticket.model';

import { TicketCard } from "../../../shared/components/ticket-card/ticket-card";
import { ActionCards, OpenTicketRequest } from "../../../shared/components/action-cards/action-cards";
import { TicketModal } from "../../../shared/components/ticket-modal/ticket-modal";
import { AuthService } from '../../../services/auth/auth';
import { ViewModeService } from '../../../services/view-mode/view-mode-service';
import { TicketDetail } from "../../../shared/components/ticket-detail/ticket-detail";
import { ProposalsModal } from "../../../shared/components/proposal-modal/proposal-modal";
import { UserService } from '../../../services/user/user';
import { ToastrService } from '@iqx-limited/ngx-toastr';

@Component({
  selector: 'app-home',
  imports: [RouterLink, TicketCard, ActionCards, TicketModal, TicketDetail, ProposalsModal],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {

  categories: Category[] = [];
  tickets: Ticket[] = [];
  availableTickets: Ticket[] = [];

  loadingMyTickets = false;
  loadingAvailableTickets = false;
  loadingCategories = false;
  myTicketsError: string | null = null;
  availableTicketsError: string | null = null;
  categoriesError: string | null = null;

  isModalOpen = false
  isModalUrgent = false
  preselectedCategoryId: number | null = null;

  isDetailModalOpen = false
  selectedTicket: Ticket | null = null;

  isProposalsModalOpen = false;
  selectedTicketForProposals: Ticket | null = null;
  updatingUrgency = false;


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

  get firstThreeMyTickets(): Ticket[] {
    return this.tickets.slice(0, 3);
  }

  get firstThreeCategories(): Category[] {
    return this.categories.slice(0, 3);
  }

  get firstThreeAvailableTickets(): Ticket[] {
    return this.availableTickets.slice(0, 3);
  }

  ngOnInit(): void {
    if (this.authService.isProvider()) {
      this.viewModeService.setMode('provider');
    }
    this.loadMyTickets();
    if (this.authService.isProvider()) {
      this.loadAvailableTickets();
    }
    this.loadCategories();
  }

  private async loadMyTickets(): Promise<void> {
    this.loadingMyTickets = true;
    this.myTicketsError = null;

    try {
      this.tickets =
        await this.ticketService.getMyTickets();
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
    this.isDetailModalOpen = true;
  }

  closeTicketDetail(): void {
    this.isDetailModalOpen = false
    this.selectedTicket = null;
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
    this.selectedTicket = updatedTicket;
    this.cdr.detectChanges();
  }

  // ===== MODAL DE PROPOSTAS (novo) =====

  openProposalsModal(ticket: Ticket): void {
    this.selectedTicketForProposals = ticket;
    this.isProposalsModalOpen = true;
  }

  closeProposalsModal(): void {
    this.isProposalsModalOpen = false;
    this.selectedTicketForProposals = null;
  }

  onProposalsTicketUpdated(updatedTicket: Ticket): void {
    this.tickets = this.tickets.map(ticket =>
      ticket.id === updatedTicket.id
        ? updatedTicket
        : ticket
    );
    this.availableTickets = this.availableTickets.map(ticket =>
      ticket.id === updatedTicket.id
        ? updatedTicket
        : ticket
    );

    this.selectedTicketForProposals = updatedTicket;
    this.cdr.detectChanges();
  }

  // ===== MODAL DE CRIAÇÃO =====

  onActionCardsOpenTicket(request: OpenTicketRequest): void {
    this.isModalUrgent = request.urgent;
    this.preselectedCategoryId = null;
    this.isModalOpen = true;
  }

  onCategoryClick(category: Category): void {
    this.isModalUrgent = false;
    this.preselectedCategoryId = category.id;
    this.isModalOpen = true;
  }

  openNormalTicketModal(): void {
    this.onActionCardsOpenTicket({ urgent: false });
  }

  closeTicketModal(): void {
    this.isModalOpen = false;
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

}
