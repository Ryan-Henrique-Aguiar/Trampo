import { Component, OnInit, signal } from '@angular/core';
import { Ticket } from '../../../models/ticket.model';
import { TicketService } from '../../../services/ticket/ticket-service';
import { TicketStatus } from '../../../enums/ticket-status';
import { TicketCard } from "../../../shared/components/ticket-card/ticket-card";
import { ActionCards } from "../../../shared/components/action-cards/action-cards";
// Interface para o usuário (simulada)
interface User {
  id: string;
  name: string;
  type: 'client' | 'provider';
  categories?: string[]; // Categorias de interesse (para profissionais)
}

@Component({
  selector: 'app-tickets',
  imports: [TicketCard, ActionCards],
  templateUrl: './tickets.html',
  styleUrl: './tickets.css',
})

export class Tickets implements OnInit {
  mode: 'client' | 'provider' = 'client';
  tickets = signal<Ticket[]>([]);
  availableTickets = signal<Ticket[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  private currentUser: User = {
    id: '1', // Usuário 1 (cliente que criou os tickets #1 e #3)
    name: 'João Silva',
    type: 'client',
    categories: ['1', '2', '3'] // Caso seja profissional, categorias de interesse
  };

  constructor(
    private ticketService: TicketService
  ) { }

  ngOnInit(): void {
    this.loadTickets();
  }


  /**
   * Carrega os tickets do usuário (modo cliente)
   * Mostra apenas os tickets criados pelo usuário
   */
    private loadTickets(): void {
    this.loading.set(true);
    this.error.set(null);

    // AGORA FUNCIONA DIRETO NO JSON SERVER!
    this.ticketService.getByUserId(this.currentUser.id).subscribe({
      next: (tickets) => {
        console.log('Tickets encontrados:', tickets);
        
        // Filtra apenas tickets ativos
        const activeTickets = tickets.filter(
          t => t.status !== TicketStatus.CANCELLED && 
               t.status !== TicketStatus.COMPLETED
        );
        
        this.tickets.set(activeTickets);
        this.loading.set(false);
        
        if (activeTickets.length === 0) {
          console.log('Nenhum ticket ativo encontrado para o usuário');
        }
      },
      error: (err) => {
        console.error('Erro ao carregar tickets:', err);
        this.error.set('Erro ao carregar seus tickets. Tente novamente.');
        this.tickets.set([]);
        this.loading.set(false);
      }
    });
  }
  /**
   * Carrega tickets disponíveis para profissionais
   * Mostra tickets de categorias de interesse do profissional
   */
  loadAvailableTickets(): void {
    if (this.currentUser.type !== 'provider') {
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    // Pega os tickets das categorias de interesse do profissional
    const categories = this.currentUser.categories || [];

    // Para cada categoria, busca os tickets
    // JSON Server não suporta múltiplos filters diretamente,
    // então fazemos múltiplas requisições ou usamos um único filter
    if (categories.length > 0) {
      // Usando categoryId como exemplo
      this.ticketService.getByCategory(categories[0]).subscribe({
        next: (tickets) => {
          const openTickets = tickets.filter(
            t => t.status === TicketStatus.OPEN
          );
          this.availableTickets.set(openTickets);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Erro ao carregar tickets disponíveis:', err);
          this.error.set('Erro ao carregar tickets disponíveis.');
          this.availableTickets.set([]);
          this.loading.set(false);
        }
      });
    }
  }


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
