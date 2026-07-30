import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, Input, OnInit, Output, signal, SimpleChanges } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { CategoryService } from '../../../services/category/category-service';
import { TicketService } from '../../../services/ticket/ticket-service';
import { Category } from '../../../models/category.model';
import { User } from '../../../models/user.model';
import { PaymentMethod } from '../../../enums/payment-method';
import { UserService } from '../../../services/user/user';
import { LocationService, Estado, Cidade } from '../../../services/location/location';
import { CepService } from '../../../services/cep/cep-service';

@Component({
  selector: 'app-ticket-modal',
  imports: [ReactiveFormsModule],
  templateUrl: './ticket-modal.html',
  styleUrl: './ticket-modal.css',
})
export class TicketModal implements OnInit {
  // ==================== INPUTS & OUTPUTS ====================
  @Input() isOpen = false;
  @Input() isUrgent = false;
  @Input() preselectedCategoryId: number | null = null;
  @Output() close = new EventEmitter<void>();

  // ==================== PUBLIC SIGNALS ====================
  public categories = signal<Category[]>([]);
  public currentStep = signal(1);
  public isSubmitting = signal(false);
  public providers = signal<User[]>([]);
  public estados = signal<Estado[]>([]);
  public cidades = signal<Cidade[]>([]);
  public cepLoading = signal(false);
  public cepError = signal<string | null>(null);

  // ==================== PUBLIC PROPERTIES ====================
  public ticketForm!: FormGroup;
  public totalSteps = 4;

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

  // ==================== PRIVATE PROPERTIES ====================
  // Step 1: Básico
  // Step 2: Localização (estado, cidade)
  // Step 3: Endereço (cep, bairro, rua, número, complemento)
  // Step 4: Detalhes (normal) / Prestadores (urgente)
  private normalStepFields: Record<number, string[]> = {
    1: ['title', 'description', 'categoryId'],
    2: ['address.city', 'address.state'],
    3: ['address.street', 'address.number', 'address.neighborhood', 'address.zipCode'],
    4: ['priceRange.min', 'priceRange.max', 'paymentMethods', 'availableDays', 'availableHours'],
  };

  private urgentStepFields: Record<number, string[]> = {
    1: ['title', 'description', 'categoryId'],
    2: ['address.city', 'address.state'],
    3: ['address.street', 'address.number', 'address.neighborhood', 'address.zipCode'],
  };

  // ==================== COMPUTED PROPERTIES ====================
  private get stepFields(): Record<number, string[]> {
    return this.isUrgent ? this.urgentStepFields : this.normalStepFields;
  }

  // ==================== CONSTRUCTOR ====================
  constructor(
    private categoryService: CategoryService,
    private ticketService: TicketService,
    private userService: UserService,
    private locationService: LocationService,
    private cepService: CepService

  ) { }

  // ==================== LIFECYCLE HOOKS ====================
  ngOnInit(): void {
    this.initializeForm();
    this.getCategories();
    this.loadEstados();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen && this.ticketForm) {
      if (this.preselectedCategoryId != null) {
        this.ticketForm.get('categoryId')?.setValue(this.preselectedCategoryId);
      }
    }
  }

  // ==================== FORM INITIALIZATION ====================
  private initializeForm(): void {
    this.ticketForm = new FormGroup({
      title: new FormControl(null, [Validators.required, Validators.maxLength(50)]),
      description: new FormControl(null, [Validators.required, Validators.maxLength(500)]),
      categoryId: new FormControl(null, [Validators.required]),
      address: new FormGroup({
        street: new FormControl(null, [Validators.required]),
        number: new FormControl(null, [Validators.required]),
        neighborhood: new FormControl(null, [Validators.required]),
        city: new FormControl({ value: null, disabled: true }, [Validators.required]), // disabled até escolher estado
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

  // ==================== LOCATION ====================
  private loadEstados(): void {
    this.locationService.getEstados().subscribe({
      next: (estados) => this.estados.set(estados),
      error: (err: HttpErrorResponse) => console.error('Erro ao carregar estados:', err),
    });
  }

  public onEstadoChange(): void {
    const sigla = this.ticketForm.get('address.state')?.value;
    const estado = this.estados().find(e => e.sigla === sigla);

    const cityControl = this.ticketForm.get('address.city');
    cityControl?.setValue(null);
    cityControl?.disable();
    this.cidades.set([]);

    if (!estado) return;

    this.locationService.getCidades(estado.id).subscribe({
      next: (cidades) => {
        this.cidades.set(cidades);
        cityControl?.enable();
      },
      error: (err: HttpErrorResponse) => console.error('Erro ao carregar cidades:', err),
    });
  }

  public formatCep(event: any): void {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length > 5) {
      value = value.substring(0, 5) + '-' + value.substring(5, 8);
    }
    this.ticketForm.get('address.zipCode')?.setValue(value, { emitEvent: false });
  }

  public onCepBlur(): void {
    const cepControl = this.ticketForm.get('address.zipCode');
    const cep = cepControl?.value;

    if (!cep) return;

    const cepClean = cep.replace(/\D/g, '');
    if (cepClean.length !== 8) {
      this.cepError.set('CEP deve ter 8 dígitos');
      return;
    }
    this.cepLoading.set(true);
    this.cepError.set(null);

    this.cepService.getCep(cepClean).subscribe({
      next: (address) => {
        this.cepLoading.set(false);
        this.ticketForm.get('address.street')?.setValue(address.logradouro);
        this.ticketForm.get('address.neighborhood')?.setValue(address.bairro);
      },
      error: () => {
        this.cepLoading.set(false);
        this.cepError.set('CEP não encontrado. Preencha o endereço manualmente.');
      },
    });
  }

  // ==================== API CALLS ====================
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

    this.ticketService.create(this.ticketForm.getRawValue()).subscribe({ // getRawValue por causa do city disabled
      next: () => {
        this.closeModal();
        this.resetForm();
      },
      error: (err: HttpErrorResponse) => {
        console.error('Erro ao criar ticket:', err);
      },
    });
  }

  private createUrgentTicket(): void {
    if (this.isSubmitting()) return;
    this.isSubmitting.set(true);

    const value = this.ticketForm.getRawValue(); // getRawValue por causa do city disabled
    const dto = {
      title: value.title,
      description: value.description,
      categoryId: Number(value.categoryId),
      address: value.address,
    };

    this.ticketService.createUrgent(dto).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        const state = value.address.state;
        const city = value.address.city;
        this.loadProviders(value.categoryId, state, city);
        this.currentStep.set(4);
      },
      error: (err: HttpErrorResponse) => {
        this.isSubmitting.set(false);
        console.error('Erro ao criar ticket urgente:', err);
      },
    });
  }

  // ==================== LOAD PROVIDERS ====================
  private loadProviders(categoryId: number, state: string, city: string): void {
    this.userService.getProvidersWithUrgency(categoryId, state, city).subscribe({
      next: (providers: User[]) => {
        const filtered = providers.filter(user =>
          user.categoryIds?.includes(Number(categoryId))
        );
        this.providers.set(filtered);

        if (filtered.length === 0) {
          console.warn('Nenhum prestador encontrado para os critérios informados.');
        }
      },
      error: (err: HttpErrorResponse) => {
        console.error('Erro ao buscar prestadores:', err);
        this.providers.set([]);
      },
    });
  }

  // ==================== STEP NAVIGATION ====================
  public nextStep(): void {
    if (!this.isStepValid(this.currentStep())) {
      this.markStepAsTouched(this.currentStep());
      return;
    }

    if (this.isUrgent && this.currentStep() === 3) {
      this.createUrgentTicket();
      return;
    }

    if (this.currentStep() < this.totalSteps) {
      this.currentStep.update(step => step + 1);
    }
  }

  public prevStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.update(step => step - 1);
    }
  }

  // ==================== STEP VALIDATION ====================
  private isStepValid(step: number): boolean {
    const fields = this.stepFields[step];
    if (!fields) return true;
    return fields.every(field => this.ticketForm.get(field)?.valid);
  }

  private markStepAsTouched(step: number): void {
    this.stepFields[step]?.forEach(field => this.ticketForm.get(field)?.markAsTouched());
  }

  // ==================== FORM HELPERS ====================
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

  // ==================== PROVIDERS ACTIONS ====================
  public openWhatsapp(provider: User): void {
    const message = `Olá ${provider.name}, vi seu perfil e preciso de um atendimento urgente.`;
    const url = `https://wa.me/${provider.phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  }

  // ==================== MODAL CONTROLS ====================
  public closeModal(): void {
    this.resetForm();
    this.close.emit();
  }

  public onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.closeModal();
    }
  }

  // ==================== RESET ====================
  private resetForm(): void {
    this.currentStep.set(1);
    this.providers.set([]);
    this.cidades.set([]);
    this.isSubmitting.set(false);
    this.cepError.set(null);
    this.cepLoading.set(false);
    this.ticketForm.reset();
    this.ticketForm.get('paymentMethods')?.setValue([]);
    this.ticketForm.get('availableDays')?.setValue([]);
    this.ticketForm.get('availableHours')?.setValue([]);
    this.ticketForm.get('address.city')?.disable();
  }
}