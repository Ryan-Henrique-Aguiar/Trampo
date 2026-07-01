import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CategoryService } from '../../../services/category/category-service';
import { TicketService } from '../../../services/ticket/ticket-service';
import { Category } from '../../../models/category.model';
import { PaymentMethod } from '../../../enums/payment-method';
import { TicketType } from '../../../enums/ticket-type';

@Component({
  selector: 'app-ticket-modal',
  imports: [ReactiveFormsModule],
  templateUrl: './ticket-modal.html',
  styleUrl: './ticket-modal.css',
})
export class TicketModal implements OnInit {

  @Input() isOpen = false;
  @Input() isUrgent = false;
  @Output() close = new EventEmitter<void>();

  public categories: Category[] = [];
  public currentStep = 1;
  public ticketForm!: FormGroup;

  public paymentOptions = [
    { label: 'Pix', value: PaymentMethod.PIX },
    { label: 'Crédito', value: PaymentMethod.CREDIT },
    { label: 'Débito', value: PaymentMethod.DEBIT },
    { label: 'Dinheiro', value: PaymentMethod.CASH },
  ];

  public dayOptions = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

  public hourOptions = [
    '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
  ];

  // Campos que pertencem a cada step, usados na validação por etapa
  private stepFields: Record<number, string[]> = {
    1: ['title', 'description', 'categoryId'],
    2: ['address.street', 'address.number', 'address.neighborhood', 'address.city', 'address.state', 'address.zipCode'],
    3: ['priceRange.min', 'priceRange.max', 'paymentMethods', 'availableDays', 'availableHours'],
  };

  constructor(
    private categoryService: CategoryService,
    private ticketService: TicketService
  ) {}

  ngOnInit(): void {
    this.getCategories();

    this.ticketForm = new FormGroup({
      title: new FormControl(null, [Validators.required, Validators.maxLength(50)]),
      description: new FormControl(null, [Validators.required, Validators.maxLength(500)]),
      categoryId: new FormControl(null, [Validators.required]),
      address: new FormGroup({
        street: new FormControl(null, [Validators.required]),
        number: new FormControl(null, [Validators.required]),
        neighborhood: new FormControl(null, [Validators.required]),
        city: new FormControl(null, [Validators.required]),
        state: new FormControl(null, [Validators.required, Validators.maxLength(2)]),
        zipCode: new FormControl(null, [Validators.required]),
        complement: new FormControl(null),
      }),
      priceRange: new FormGroup({
        min: new FormControl(null, [Validators.required]),
        max: new FormControl(null, [Validators.required]),
      }),
      paymentMethods: new FormControl([], [Validators.required]),
      availableDays: new FormControl([], [Validators.required]),
      availableHours: new FormControl([], [Validators.required]),
    });
  }

  private getCategories(): void {
    this.categoryService.getAll().subscribe({
      next: (categories) => this.categories = categories,
      error: (err: HttpErrorResponse) => console.error('Erro ao carregar categorias:', err),
    });
  }
   public saveTicket(): void {
    if (this.ticketForm.invalid) {
      this.ticketForm.markAllAsTouched();
      return;
    }

    const form = {
      ...this.ticketForm.value,
      type: this.isUrgent ? TicketType.URGENT : TicketType.NORMAL,
    };

    this.ticketService.create(form).subscribe({
      next: () => {
        this.closeModal();
        this.resetForm();
      },
      error: (err: HttpErrorResponse) => {
        console.error('Erro ao criar ticket:', err);
      },
    });
  }

  public nextStep(): void {
    if (!this.isStepValid(this.currentStep)) {
      this.markStepAsTouched(this.currentStep);
      return;
    }

    if (this.currentStep < 3) this.currentStep++;
  }

  public prevStep(): void {
    if (this.currentStep > 1) this.currentStep--;
  }

  private isStepValid(step: number): boolean {
    return this.stepFields[step].every(field => this.ticketForm.get(field)?.valid);
  }

  private markStepAsTouched(step: number): void {
    this.stepFields[step].forEach(field => this.ticketForm.get(field)?.markAsTouched());
  }

  /** Usado no HTML para exibir mensagem de erro só quando o campo foi tocado e está inválido. */
  public isInvalid(field: string): boolean {
    const control = this.ticketForm.get(field);
    return !!control && control.invalid && control.touched;
  }

  public isSelected(field: string, value: any): boolean {
    return (this.ticketForm.get(field)?.value || []).includes(value);
  }

  public toggleSelection(field: string, value: any): void {
    const current = this.ticketForm.get(field)?.value || [];
    const updated = current.includes(value)
      ? current.filter((item: any) => item !== value)
      : [...current, value];

    this.ticketForm.get(field)?.setValue(updated);
    this.ticketForm.get(field)?.markAsTouched();
  }

  public closeModal(): void {
    this.resetForm();
    this.close.emit();
  }

  public onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.closeModal();
    }
  }

  private resetForm(): void {
    this.currentStep = 1;
    this.ticketForm.reset();
    this.ticketForm.get('paymentMethods')?.setValue([]);
    this.ticketForm.get('availableDays')?.setValue([]);
    this.ticketForm.get('availableHours')?.setValue([]);
  }
}