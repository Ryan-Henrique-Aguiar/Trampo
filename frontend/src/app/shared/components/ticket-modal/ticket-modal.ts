import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, Input, OnInit, Output, signal, computed } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CategoryService } from '../../../services/category/category-service';
import { TicketService } from '../../../services/ticket/ticket-service';
import { Category } from '../../../models/category.model';
import { PaymentMethod } from '../../../enums/payment-method';

interface FakeProvider {
  id: number;
  name: string;
  category: string;
  rating: number;
  distanceKm: number;
  whatsapp: string;
}

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

  public categories = signal<Category[]>([]);
  public currentStep = signal(1);
  public isSubmitting = signal(false);
  public providers = signal<FakeProvider[]>([]);
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

  private normalStepFields: Record<number, string[]> = {
    1: ['title', 'description', 'categoryId'],
    2: ['address.street', 'address.number', 'address.neighborhood', 'address.city', 'address.state', 'address.zipCode'],
    3: ['priceRange.min', 'priceRange.max', 'paymentMethods', 'availableDays', 'availableHours'],
  };

  private urgentStepFields: Record<number, string[]> = {
    1: ['title', 'description', 'categoryId'],
    2: ['address.street', 'address.number', 'address.neighborhood', 'address.city', 'address.state', 'address.zipCode'],
  };

  private get stepFields(): Record<number, string[]> {
    return this.isUrgent ? this.urgentStepFields : this.normalStepFields;
  }

  public totalSteps = 3;

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
      next: (categories) => this.categories.set(categories),
      error: (err: HttpErrorResponse) => console.error('Erro ao carregar categorias:', err),
    });
  }

  public saveTicket(): void {
    if (this.ticketForm.invalid) {
      this.ticketForm.markAllAsTouched();
      return;
    }

    this.ticketService.create(this.ticketForm.value).subscribe({
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
    if (!this.isStepValid(this.currentStep())) {
      this.markStepAsTouched(this.currentStep());
      return;
    }

    if (this.isUrgent && this.currentStep() === 2) {
      this.createUrgentTicket();
      return;
    }

    if (this.currentStep() < this.totalSteps) {
      this.currentStep.update(step => step + 1);
    }
  }

  private createUrgentTicket(): void {
    if (this.isSubmitting()) return;
    this.isSubmitting.set(true);

    const value = this.ticketForm.value;
    const dto = {
      title: value.title,
      description: value.description,
      categoryId: Number(value.categoryId),
      address: value.address,
    };

    this.ticketService.createUrgent(dto).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.loadFakeProviders(value.categoryId);
        this.currentStep.set(3);
      },
      error: (err: HttpErrorResponse) => {
        this.isSubmitting.set(false);
        console.error('Erro ao criar ticket urgente:', err);
      },
    });
  }

  private loadFakeProviders(categoryId: number): void {
    const categoryName = this.categories().find(c => c.id === categoryId)?.name ?? 'Serviço';

    this.providers.set([
      { id: 1, name: 'Carlos Silva', category: categoryName, rating: 4.8, distanceKm: 1.2, whatsapp: '5511999990001' },
      { id: 2, name: 'Ana Pereira', category: categoryName, rating: 4.6, distanceKm: 2.5, whatsapp: '5511999990002' },
      { id: 3, name: 'João Santos', category: categoryName, rating: 4.9, distanceKm: 3.1, whatsapp: '5511999990003' },
    ]);
  }

  public openWhatsapp(provider: FakeProvider): void {
    const message = `Olá ${provider.name}, vi seu perfil e preciso de um atendimento urgente.`;
    const url = `https://wa.me/${provider.whatsapp}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  }

  public prevStep(): void {
    if (this.currentStep() > 1) this.currentStep.update(step => step - 1);
  }

  private isStepValid(step: number): boolean {
    const fields = this.stepFields[step];
    if (!fields) return true;
    return fields.every(field => this.ticketForm.get(field)?.valid);
  }

  private markStepAsTouched(step: number): void {
    this.stepFields[step]?.forEach(field => this.ticketForm.get(field)?.markAsTouched());
  }

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
    this.currentStep.set(1);
    this.providers.set([]);
    this.isSubmitting.set(false);
    this.ticketForm.reset();
    this.ticketForm.get('paymentMethods')?.setValue([]);
    this.ticketForm.get('availableDays')?.setValue([]);
    this.ticketForm.get('availableHours')?.setValue([]);
  }
}