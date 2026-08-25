import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
import { TicketDetail } from "../../../shared/components/ticket-detail/ticket-detail";
import { ProposalsModal } from "../../../shared/components/proposal-modal/proposal-modal"; // ajuste o caminho

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

  loading = false;
  error: string | null = null;

  isModalOpen = false
  isModalUrgent = false
  preselectedCategoryId: number | null = null;

  isDetailModalOpen = false
  selectedTicket: Ticket | null = null;

  //modal de propostas
  isProposalsModalOpen = false;
  selectedTicketForProposals: Ticket | null = null;


  constructor(
    private categoryService: CategoryService,
    private ticketService: TicketService,
    private authService: AuthService,
    private viewModeService: ViewModeService,
    private cdr: ChangeDetectorRef
  ) {

  }

  get isProvider() {
    return this.authService.isProvider();
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
    this.loadTickets();
    this.loadCategories();
  }

  private async loadTickets(): Promise<void> {
    this.loading = true;
    this.error = null;
    try {
      this.tickets =
        await this.ticketService.getMyTickets();

      if (this.authService.isProvider()) {
        this.availableTickets = await this.ticketService.getAvailableTickets();
      }else{
        this.availableTickets = []
      }
    } catch (err) {
      console.error(
        'Erro ao carregar tickets:',
        err
      );
      this.tickets = [];
      this.availableTickets = [];
      this.error =
        'Não foi possível carregar seus serviços.';
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  private async loadCategories(): Promise<void> {
    try {
      this.categories =
        await this.categoryService.getAll();
    } catch (err) {
      console.error(
        'Erro ao carregar categorias:',
        err
      );
      this.categories = [];
    } finally {
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

  closeTicketModal(): void {
    this.isModalOpen = false;
  }


  onTicketCreated(ticket: Ticket): void {
    this.tickets = [ticket, ...this.tickets];
    this.cdr.detectChanges();
  }

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