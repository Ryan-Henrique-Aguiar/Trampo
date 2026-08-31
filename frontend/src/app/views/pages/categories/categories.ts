import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from '@iqx-limited/ngx-toastr';
import { Category } from '../../../models/category.model';
import { CategoryService } from '../../../services/category/category-service';
import { TicketModal } from '../../../shared/components/ticket-modal/ticket-modal';

@Component({
  selector: 'app-categories',
  imports: [ReactiveFormsModule, TicketModal],
  templateUrl: './categories.html',
  styleUrl: './categories.css',
})
export class Categories implements OnInit {
  categories: Category[] = [];
  loading = false;
  error: string | null = null;
  isModalOpen = false;
  preselectedCategoryId: number | null = null;
  searchTerm = '';
  isSuggestionModalOpen = false;

  suggestionForm = new FormGroup({
    categoryName: new FormControl('', [
      Validators.required,
      Validators.maxLength(100)
    ]),
    description: new FormControl('', [
      Validators.required,
      Validators.maxLength(500)
    ])
  });

  constructor(
    private categoryService: CategoryService,
    private toastrService: ToastrService,
    private cdr: ChangeDetectorRef
  ) {}

  get filteredCategories(): Category[] {
    const search = this.normalizeText(this.searchTerm);

    if (!search) return this.categories;

    return this.categories.filter(category =>
      this.normalizeText(category.name).includes(search)
    );
  }

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

  updateSearch(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value;
  }

  openSuggestionModal(): void {
    this.isSuggestionModalOpen = true;
  }

  closeSuggestionModal(): void {
    this.isSuggestionModalOpen = false;
    this.suggestionForm.reset();
  }

  submitSuggestion(): void {
    if (this.suggestionForm.invalid) {
      this.suggestionForm.markAllAsTouched();
      return;
    }

    this.toastrService.success('Sugestão enviada com sucesso');
    this.closeSuggestionModal();
  }

  onSuggestionOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('suggestion-overlay')) {
      this.closeSuggestionModal();
    }
  }

  private normalizeText(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }
}
