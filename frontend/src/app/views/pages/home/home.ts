import { Component, computed, OnInit, signal, inject, ChangeDetectorRef } from '@angular/core';
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
import { tick } from '@angular/core/testing';

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
  ){

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

  get firstThreeMyTickets(): Ticket[]{
    return this.tickets
    .filter(ticket => ticket.status === TicketStatus.OPEN)
    .slice(0, 3)
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
    this.loadHomeData();
  }

  private async loadHomeData(): Promise<void> {
    this.loading = true;
    this.error = null;

    try {
      await Promise.all([
        this.loadCategories(),
        this.loadTickets()
      ]);
    } catch (err) {
      console.error('Erro ao carregar home:', err);
      this.error = 'Erro ao carregar os dados.';
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }
  private async loadTickets(): Promise<void> {
    const userId = this.authService.currentUser?.id;

    if (userId === undefined) {
      throw new Error('Usuário não autenticado.');
    }

    // Enquanto tickets estiverem no JSON Server
    this.tickets =
      await this.ticketService.getByUserId(userId);

    if (this.authService.isProvider()) {
      const categoryIds =
        this.authService.currentUser?.categoryIds ?? [];

      this.availableTickets =
        await this.ticketService.getTickets({
          status: TicketStatus.OPEN,
          categoryId: categoryIds
        });
    }
  }
  private async loadCategories(): Promise<void> {
    this.categories = await this.categoryService.getAll();
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
    this.tickets =this.tickets.map(ticket=>
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