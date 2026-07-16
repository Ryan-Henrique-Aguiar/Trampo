import { Component, computed, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CategoryService } from '../../../services/category/category-service';
import { TicketService } from '../../../services/ticket/ticket-service';

import { Category } from '../../../models/category.model';
import { Ticket } from '../../../models/ticket.model';

import { TicketStatus } from '../../../enums/ticket-status';
import { TicketCard } from "../../../shared/components/ticket-card/ticket-card";
import { ActionCards } from "../../../shared/components/action-cards/action-cards";

@Component({
  selector: 'app-home',
  imports: [RouterLink, TicketCard, ActionCards],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {

  categories=  signal<Category[]>([]);
  tickets = signal<Ticket[]>([]);

  constructor(
    private categoryService: CategoryService,
    private ticketService: TicketService
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadTickets();
  }


  private loadTickets(): void {
      this.ticketService.getAll().subscribe({
        next: (tickets) => {
          this.tickets.set(tickets);
        },
        error: (err) => {
          console.error('Erro ao carregar tickets:', err);
          this.tickets.set([]); 
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
        this.tickets.set([]); 
      }
    });
  }


  firstThreeTickets = computed(() => this.tickets().slice(0, 3));
  firstThreeCategories = computed(() => this.categories().slice(0, 6));

  getStatusLabel(status: TicketStatus): string {
    const labels: Record<TicketStatus, string> = {
      [TicketStatus.OPEN]: 'Aberto',
      [TicketStatus.WITH_PROPOSALS]: 'Com propostas',
      [TicketStatus.IN_PROGRESS]: 'Em andamento',
      [TicketStatus.COMPLETED]: 'Finalizado',
      [TicketStatus.CANCELLED]: 'Cancelado'
    };

    return labels[status];
  }


}