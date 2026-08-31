import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Category } from '../../../models/category.model';
import { CategoryService } from '../../../services/category/category-service';
import { TicketModal } from '../../../shared/components/ticket-modal/ticket-modal';

@Component({
  selector: 'app-categories',
  imports: [TicketModal],
  templateUrl: './categories.html',
  styleUrl: './categories.css',
})
export class Categories implements OnInit {
  categories: Category[] = [];
  loading = false;
  error: string | null = null;
  isModalOpen = false;
  preselectedCategoryId: number | null = null;

  constructor(
    private categoryService: CategoryService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  private async loadCategories(): Promise<void> {
    this.loading = true;
    this.error = null;

    try {
      this.categories = await this.categoryService.getAll();
    } catch (err) {
      console.error('Erro ao carregar categorias:', err);
      this.categories = [];
      this.error = 'Não foi possível carregar as categorias.';
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  openTicketModal(category: Category): void {
    this.preselectedCategoryId = category.id;
    this.isModalOpen = true;
  }

  closeTicketModal(): void {
    this.isModalOpen = false;
    this.preselectedCategoryId = null;
  }
}
