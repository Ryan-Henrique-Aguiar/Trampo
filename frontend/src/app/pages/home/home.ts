import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Category, CategoryService } from '../../services/category/category-service';
import { Ticket, TicketService } from '../../services/ticket/ticket-service';


export type ServiceStatus =
  | 'open'
  | 'with_proposals'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  categories: Category[] = [];
  services: Ticket[] = [];

  constructor(
    private categoryService: CategoryService,
    private ticketService: TicketService
  ) {}

  ngOnInit() {
    this.categoryService.getAll().subscribe(data => this.categories = data);
      this.ticketService.getAll().subscribe({
    next: (data) => {
      console.log('tickets:', data);
      this.services = data;
    },
    error: (err) => console.error('erro:', err)
  });
  }

getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      open: 'Aberto',
      with_proposals: 'Com propostas',
      in_progress: 'Em andamento',
      completed: 'Finalizado',
      cancelled: 'Cancelado',
    };
    return labels[status] ?? status;
  }

  openRequestServiceModal(category?: Category): void {
    console.log('abrir modal com categoria:', category?.name);
  }

  openUrgentServiceModal(): void {
    console.log('abrir modal: chamado urgente');
  }
}