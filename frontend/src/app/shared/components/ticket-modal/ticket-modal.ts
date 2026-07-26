import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CategoryService } from '../../../services/category/category-service';
import { TicketService } from '../../../services/ticket/ticket-service';
import { Category } from '../../../models/category.model';
import { CreateTicketRequest } from '../../../dto/ticket/create-ticket-request';

@Component({
  selector: 'app-ticket-modal',
  imports: [ReactiveFormsModule],
  templateUrl: './ticket-modal.html',
  styleUrl: './ticket-modal.css',
})
export class TicketModal implements OnInit {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();

  categories: Category[] = [];
  currentStep = 1;
  ticketForm!: FormGroup;
  isSubmitting = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  // Valores alinhados com o mock/backend
  paymentOptions = [
    { label: 'Pix', value: 'PIX' },
    { label: 'Crédito', value: 'CREDITO' },
    { label: 'Débito', value: 'DEBITO' },
    { label: 'Dinheiro', value: 'DINHEIRO' },
  ];

  dayOptions = ['SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO', 'DOMINGO'];

  hourOptions = [
    '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
  ];

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
    this.buildForm();
  }

  private buildForm(): void {
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
      next: (categories) => (this.categories = categories),
      error: (err: HttpErrorResponse) => console.error('Erro ao carregar categorias:', err),
    });
  }

  saveTicket(): void {
    if (this.ticketForm.invalid) {
      this.ticketForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;
    this.successMessage = null;

    const formValue = this.ticketForm.value;
    const dto: CreateTicketRequest = {
      title: formValue.title,
      description: formValue.description,
      categoryId: formValue.categoryId,
      address: formValue.address,
      priceMin: formValue.priceRange?.min ?? undefined,
      priceMax: formValue.priceRange?.max ?? undefined,
      paymentMethods: formValue.paymentMethods?.length ? formValue.paymentMethods : undefined,
      availableDays: formValue.availableDays?.length ? formValue.availableDays : undefined,
      availableHours: formValue.availableHours?.length ? formValue.availableHours : undefined,
      serviceDate: new Date().toISOString(), // idealmente você teria um campo de data no form; por enquanto, data atual
    };

    this.ticketService.create(dto).subscribe({
      next: () => {
        this.successMessage = 'Serviço publicado com sucesso!';
        this.isSubmitting = false;
        setTimeout(() => {
          this.closeModal();
        }, 1500);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Erro ao criar ticket:', err);
        this.errorMessage = 'Erro ao publicar serviço. Tente novamente.';
        this.isSubmitting = false;
      },
    });
  }

  nextStep(): void {
    if (!this.isStepValid(this.currentStep)) {
      this.markStepAsTouched(this.currentStep);
      return;
    }
    if (this.currentStep < 3) this.currentStep++;
  }

  prevStep(): void {
    if (this.currentStep > 1) this.currentStep--;
  }

  private isStepValid(step: number): boolean {
    return this.stepFields[step].every((field) => this.ticketForm.get(field)?.valid);
  }

  private markStepAsTouched(step: number): void {
    this.stepFields[step].forEach((field) => this.ticketForm.get(field)?.markAsTouched());
  }

  isInvalid(field: string): boolean {
    const control = this.ticketForm.get(field);
    return !!control && control.invalid && control.touched;
  }

  isSelected(field: string, value: any): boolean {
    return (this.ticketForm.get(field)?.value || []).includes(value);
  }

  toggleSelection(field: string, value: any): void {
    const current = this.ticketForm.get(field)?.value || [];
    const updated = current.includes(value)
      ? current.filter((item: any) => item !== value)
      : [...current, value];
    this.ticketForm.get(field)?.setValue(updated);
    this.ticketForm.get(field)?.markAsTouched();
  }

  closeModal(): void {
    this.resetForm();
    this.close.emit();
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.closeModal();
    }
  }

  private resetForm(): void {
    this.currentStep = 1;
    this.errorMessage = null;
    this.successMessage = null;
    this.ticketForm.reset({
      title: null,
      description: null,
      categoryId: null,
      priceRange: { min: null, max: null },
      paymentMethods: [],
      availableDays: [],
      availableHours: [],
      address: {
        street: null,
        number: null,
        neighborhood: null,
        city: null,
        state: null,
        zipCode: null,
        complement: null,
      },
    });
  }
}