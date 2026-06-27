import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../../services/category/category-service';
import { TicketService } from '../../../services/ticket/ticket-service';
import { Category } from '../../../models/category.model';
import { PaymentMethod } from '../../../enums/payment-method';
import { TicketType } from '../../../enums/ticket-type';

@Component({
  selector: 'app-ticket-modal',
  imports: [FormsModule],
  templateUrl: './ticket-modal.html',
  styleUrl: './ticket-modal.css',
})
export class TicketModal implements OnInit {

  @Input() isOpen = false;
  @Input() isUrgent = false;
  @Output() close = new EventEmitter<void>();

  categories: Category[] = [];
  currentStep = 1;
  paymentOptions = [
    { label: 'Pix', value: PaymentMethod.PIX },
    { label: 'Crédito', value: PaymentMethod.CREDIT },
    { label: 'Débito', value: PaymentMethod.DEBIT },
    { label: 'Dinheiro', value: PaymentMethod.CASH },
  ];

  dayOptions = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

  hourOptions = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

  form = {
    title: '',
    description: '',
    categoryId: null as number | null,
    address: {
      street: '',
      number: '',
      neighborhood: '',
      city: '',
      state: '',
      zipCode: '',
      complement: '',
    },
    priceRange: {
      min: null as number | null,
      max: null as number | null,
    },
    paymentMethods: [] as PaymentMethod[],
    availableDays: [] as string[],
    availableHours: [] as string[],
  };

  constructor(
    private categoryService: CategoryService,
    private ticketService: TicketService
  ) {}

  ngOnInit(): void {
    this.categoryService.getAll().subscribe({
      next: (categories) => this.categories = categories,
      error: (err) => console.error('Erro ao carregar categorias:', err)
    });
  }

  nextStep(): void {
      if (this.currentStep < 3) this.currentStep++;
  }

  prevStep(): void {
      if (this.currentStep > 1) this.currentStep--;
  }

  toggleSelection(array: any[], value: any): void {
    const index = array.indexOf(value);
    if (index === -1) {
      array.push(value);
    } else {
      array.splice(index, 1);
    }
  }

  isSelected(array: any[], value: any): boolean {
    return array.includes(value);
  }

  onSubmit(): void {
    const ticket = {
      ...this.form,
      type: this.isUrgent ? TicketType.URGENT : TicketType.NORMAL,
    };

    this.ticketService.create(ticket).subscribe({
      next: () => {
        this.closeModal();
        this.resetForm();
      },
      error: (err) => console.error('Erro ao criar ticket:', err)
    });
  }

  closeModal(): void {
    this.close.emit();
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.closeModal();
    }
  }

  private resetForm(): void {
    this.currentStep = 1;
    this.form = {
      title: '',
      description: '',
      categoryId: null,
      address: {
        street: '',
        number: '',
        neighborhood: '',
        city: '',
        state: '',
        zipCode: '',
        complement: '',
      },
      priceRange: {
        min: null,
        max: null,
      },
      paymentMethods: [],
      availableDays: [],
      availableHours: [],
    };
  }
}