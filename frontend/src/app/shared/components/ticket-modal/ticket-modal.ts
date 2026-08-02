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
import { CepBrasilApiService } from '../../../services/cep-brasil-api/cep-brasil-api-service';
import { Ticket } from '../../../models/ticket.model';

interface NormalizedCepAddress {
  street?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
}

// Os nomes das cidades vindos das APIs de CEP podem vir com acentuação/caixa diferentes
// da lista do IBGE ("Sao Paulo" vs "São Paulo"), então normalizamos ambos os lados
// antes de comparar
function normalizeText(value: string | null | undefined): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
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
  @Input() preselectedCategoryId: number | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() ticketCreated = new EventEmitter<Ticket>();
  public categories = signal<Category[]>([]);
  public currentStep = signal(1);
  public isSubmitting = signal(false);
  public providers = signal<User[]>([]);
  public states = signal<Estado[]>([]);
  public cities = signal<Cidade[]>([]);
  public cepLoading = signal(false);
  public cepError = signal<string | null>(null);
  public sendingProviderId = signal<number | null>(null);

  public ticketForm!: FormGroup;
  public totalSteps = 3;

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

  // passo 1: título/descrição/categoria, passo 2: endereço, passo 3: existe apenas para o fluxo normal
  private normalStepFields: Record<number, string[]> = {
    1: ['title', 'description', 'categoryId'],
    2: ['address.state', 'address.city', 'address.street', 'address.number', 'address.neighborhood'],
    3: ['priceMax', 'paymentMethods', 'availableDays', 'availableHours'],
  };

  private urgentStepFields: Record<number, string[]> = {
    1: ['title', 'description', 'categoryId'],
    2: ['address.state', 'address.city', 'address.street', 'address.number', 'address.neighborhood'],
  };

  private get stepFields(): Record<number, string[]> {
    return this.isUrgent ? this.urgentStepFields : this.normalStepFields;
  }

  constructor(
    private categoryService: CategoryService,
    private ticketService: TicketService,
    private userService: UserService,
    private locationService: LocationService,
    private cepService: CepService,
    private cepBrasilApiService: CepBrasilApiService,
  ) { }

  ngOnInit(): void {
    this.initializeForm();
    this.getCategories();
    this.loadStates();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen && this.ticketForm) {
      if (this.preselectedCategoryId != null) {
        this.ticketForm.get('categoryId')?.setValue(this.preselectedCategoryId);
      }
    }
  }

  private initializeForm(): void {
    this.ticketForm = new FormGroup({
      title: new FormControl(null, [Validators.required, Validators.maxLength(50)]),
      description: new FormControl(null, [Validators.required, Validators.maxLength(500)]),
      categoryId: new FormControl(null, [Validators.required]),
      address: new FormGroup({
        street: new FormControl(null, [Validators.required]),
        number: new FormControl(null, [Validators.required]),
        neighborhood: new FormControl(null, [Validators.required]),
        city: new FormControl({ value: null, disabled: true }, [Validators.required]), // habilitado quando um estado é selecionado (via CEP ou manualmente)
        state: new FormControl(null, [Validators.required, Validators.maxLength(2)]),
        zipCode: new FormControl(null),
        complement: new FormControl(null),
      }),
      priceMax: new FormControl(null, [Validators.required]),
      paymentMethods: new FormControl([], [Validators.required]),
      availableDays: new FormControl([], [Validators.required]),
      availableHours: new FormControl([], [Validators.required]),
    });
  }

  private loadStates(): void {
    this.locationService.getEstados().subscribe({
      next: (states) => this.states.set(states),
      error: (err: HttpErrorResponse) => console.error('Erro ao carregar estados:', err),
    });
  }

  public onStateChange(): void {
    const stateCode = this.ticketForm.get('address.state')?.value;
    const state = this.states().find(s => s.sigla === stateCode);

    const cityControl = this.ticketForm.get('address.city');
    cityControl?.setValue(null);
    cityControl?.disable();
    this.cities.set([]);

    if (!state) return;

    this.locationService.getCidades(state.id).subscribe({
      next: (cities) => {
        this.cities.set(cities);
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
        if (!address || address.erro) {
          this.tryBrasilApiFallback(cepClean);
          return;
        }
        this.applyCepAddress({
          street: address.logradouro,
          neighborhood: address.bairro,
          city: address.localidade,
          state: address.uf,
        });
      },
      error: () => this.tryBrasilApiFallback(cepClean),
    });
  }

  // ViaCEP é a consulta primária; se falhar ou retornar vazio, fazemos fallback para BrasilAPI
  // antes de desistir e deixar o usuário preencher o endereço manualmente
  private tryBrasilApiFallback(cepClean: string): void {
    this.cepBrasilApiService.getCep(cepClean).subscribe({
      next: (address) => {
        this.applyCepAddress({
          street: address.street,
          neighborhood: address.neighborhood,
          city: address.city,
          state: address.state,
        });
      },
      error: () => {
        this.cepLoading.set(false);
        this.cepError.set('CEP não encontrado. Preencha o endereço manualmente abaixo.');
        this.ticketForm.get('address.city')?.disable();
      },
    });
  }

  private applyCepAddress(data: NormalizedCepAddress): void {
    this.ticketForm.get('address.street')?.setValue(data.street ?? null);
    this.ticketForm.get('address.neighborhood')?.setValue(data.neighborhood ?? null);

    const cityControl = this.ticketForm.get('address.city');
    const stateCode = data.state ?? null;

    if (!stateCode) {
      this.cepLoading.set(false);
      return;
    }

    const state = this.states().find(s => s.sigla === stateCode);

    if (!state) {
      // estado/cidade são selects agora, então não podemos forçar um valor que não está na lista do IBGE
      cityControl?.disable();
      this.cepLoading.set(false);
      this.cepError.set('Não conseguimos identificar o estado automaticamente. Selecione manualmente.');
      return;
    }

    this.ticketForm.get('address.state')?.setValue(stateCode);

    this.locationService.getCidades(state.id).subscribe({
      next: (cities) => {
        this.cities.set(cities);
        cityControl?.enable();

        const match = cities.find(c => normalizeText(c.nome) === normalizeText(data.city));
        cityControl?.setValue(match ? match.nome : null);

        if (!match) {
          this.cepError.set('Cidade não encontrada na lista oficial. Selecione manualmente.');
        }

        this.cepLoading.set(false);
      },
      error: () => {
        cityControl?.disable();
        this.cepLoading.set(false);
      },
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

    const value = this.ticketForm.getRawValue();
    const dto = {
      title: value.title,
      description: value.description,
      categoryId: Number(value.categoryId),
      address: value.address,
      priceMax: value.priceMax,
      paymentMethods: value.paymentMethods,
      availableDays: value.availableDays,
      availableHours: value.availableHours,
    };

    this.ticketService.create(dto).subscribe({
      next: (createdTicket) => {
        this.ticketCreated.emit(createdTicket)
        this.closeModal();
        this.resetForm();
      },
      error: (err: HttpErrorResponse) => {
        console.error('Erro ao criar ticket:', err);
      },
    });
  }

  private saveUrgentTicket(provider: User, onSuccess: () => void): void {
    if (this.ticketForm.invalid) {
      this.ticketForm.markAllAsTouched();
      return;
    }

    const value = this.ticketForm.getRawValue();
    const dto = {
      title: value.title,
      description: value.description,
      categoryId: Number(value.categoryId),
      address: value.address,
      providerId: provider.id,
    };

    this.ticketService.createUrgent(dto).subscribe({
      next: () => {
        onSuccess();
      },
      error: (err: HttpErrorResponse) => {
        console.error('Erro ao criar ticket urgente:', err);
      },
    });
  }

  // apenas busca prestadores para a categoria/localização, ainda não cria nada —
  // o ticket urgente só é criado quando o usuário realmente escolher alguém no WhatsApp
  private searchProvidersForUrgentTicket(): void {
    if (this.isSubmitting()) return;
    this.isSubmitting.set(true);

    const value = this.ticketForm.getRawValue();
    const categoryId = Number(value.categoryId);
    const state = value.address.state;
    const city = value.address.city;

    this.loadProviders(categoryId, state, city, () => {
      this.isSubmitting.set(false);
      this.currentStep.set(3);
    });
  }


  private loadProviders(categoryId: number, state: string, city: string, onComplete?: () => void): void {
    this.userService.getProvidersWithUrgency(categoryId, state, city).subscribe({
      next: (providers: User[]) => {
        const filtered = providers.filter(user =>
          user.categoryIds?.includes(Number(categoryId))
        );
        this.providers.set(filtered);

        if (filtered.length === 0) {
          console.warn('Nenhum prestador encontrado para os critérios informados.');
        }
        onComplete?.();
      },
      error: (err: HttpErrorResponse) => {
        console.error('Erro ao buscar prestadores:', err);
        this.providers.set([]);
        onComplete?.();
      },
    });
  }

  public nextStep(): void {
    if (!this.isStepValid(this.currentStep())) {
      this.markStepAsTouched(this.currentStep());
      return;
    }

    if (this.isUrgent && this.currentStep() === 2) {
      this.searchProvidersForUrgentTicket();
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

  public openWhatsapp(provider: User): void {
    this.saveUrgentTicket(provider, () => {
      const message = `Olá ${provider.name}, vi seu perfil e preciso de um atendimento urgente.`;
      const url = `https://wa.me/${provider.phone}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
      this.closeModal();
      this.resetForm();
    });
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
    this.cities.set([]);
    this.isSubmitting.set(false);
    this.sendingProviderId.set(null);
    this.cepError.set(null);
    this.cepLoading.set(false);
    this.ticketForm.reset();
    this.ticketForm.get('paymentMethods')?.setValue([]);
    this.ticketForm.get('availableDays')?.setValue([]);
    this.ticketForm.get('availableHours')?.setValue([]);
    this.ticketForm.get('address.city')?.disable();
  }
}