import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { CategoryService } from '../../../services/category/category-service';
import { TicketService } from '../../../services/ticket/ticket-service';
import { Category } from '../../../models/category.model';
import { User } from '../../../models/user.model';
import { PaymentMethod } from '../../../enums/payment-method';
import { UserService } from '../../../services/user/user';
import { LocationService, State, City } from '../../../services/location/location';
import { Ticket } from '../../../models/ticket.model';
import { WeekDay } from '../../../enums/week-day';
import { ToastrService } from '@iqx-limited/ngx-toastr';

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
  public categories: Category[] = [];
  public currentStep = 1;
  public isSubmitting = false;
  public providers: User[] = [];
  public states: State[] = []
  public cities: City[] = [];
  public cepLoading = false;
  public cepError: string | null = null;
  public sendingProviderId: number | null = null;

  public ticketForm!: FormGroup;
  public totalSteps = 3;

  public paymentOptions = [
    { label: 'Pix', value: PaymentMethod.PIX },
    { label: 'Crédito', value: PaymentMethod.CREDIT },
    { label: 'Débito', value: PaymentMethod.DEBIT },
    { label: 'Dinheiro', value: PaymentMethod.CASH },
  ];

  public dayOptions = [
    { label: 'Segunda', value: WeekDay.MONDAY },
    { label: 'Terça', value: WeekDay.TUESDAY },
    { label: 'Quarta', value: WeekDay.WEDNESDAY },
    { label: 'Quinta', value: WeekDay.THURSDAY },
    { label: 'Sexta', value: WeekDay.FRIDAY },
    { label: 'Sábado', value: WeekDay.SATURDAY },
    { label: 'Domingo', value: WeekDay.SUNDAY },
  ];

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
    private cdr: ChangeDetectorRef,
    private toastrService: ToastrService
  ) { }

  async ngOnInit(): Promise<void> {
    this.initializeForm();

    await Promise.all([
      this.getCategories(),
      this.loadStates()
    ]);

    this.cdr.detectChanges();
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

  private async loadStates(): Promise<void> {
    try {
      this.states = await this.locationService.getStates();
    } catch {
      console.error("Erro ao buscar estados")
    }

  }

  public async onStateChange(): Promise<void> {
    const stateCode = this.ticketForm.get('address.state')?.value;
    const state = this.states.find(s => s.uf === stateCode);

    const cityControl = this.ticketForm.get('address.city');
    cityControl?.setValue(null);
    cityControl?.disable();
    this.cities = [];

    if (!state) return;

    try {
      this.cities = await this.locationService.getCities(state.uf);

      cityControl?.enable()
    } catch (err) {
      console.error("Erro ao carregar cidades:", err)
      this.cities = [];
    } finally {
      this.cdr.detectChanges();
    }
  }

  public formatCep(event: any): void {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length > 5) {
      value = value.substring(0, 5) + '-' + value.substring(5, 8);
    }
    this.ticketForm.get('address.zipCode')?.setValue(value, { emitEvent: false });
  }

  public async onCepBlur(): Promise<void> {
    const cep = this.ticketForm.get('address.zipCode')?.value;

    if (!cep) return;

    const cepClean = cep.replace(/\D/g, '');

    if (cepClean.length !== 8) {
      this.cepError = 'CEP deve ter 8 dígitos';
      return;
    }

    this.cepLoading = true;
    this.cepError = null;

    try {
      const address =
        await this.locationService.getCep(cepClean);

      await this.applyCepAddress({
        street: address.street,
        neighborhood: address.neighborhood,
        city: address.city,
        state: address.state
      });

    } catch (err) {
      console.error('Erro ao buscar CEP:', err);

      this.cepError =
        'CEP não encontrado. Preencha o endereço manualmente.';

      this.ticketForm
        .get('address.city')
        ?.disable();

    } finally {
      this.cepLoading = false;
      this.cdr.detectChanges();
    }
  }

  private async applyCepAddress(data: NormalizedCepAddress): Promise<void> {
    this.ticketForm.get('address.street')?.setValue(data.street ?? null);
    this.ticketForm.get('address.neighborhood')?.setValue(data.neighborhood ?? null);
    const cityControl = this.ticketForm.get('address.city');
    const stateCode = data.state ?? null;
    if (!stateCode) {
      this.cepError = "Não conseguimos identificar o estado pelo CEP"
      this.cepLoading = false;
      return;
    }
    const state = this.states.find(s => s.uf === stateCode);
    if (!state) {
      cityControl?.disable();
      this.cepLoading = false
      this.cepError = "Não conseguimos identificar o estado automaticamente. Selecione manualmente.";
      return;
    }
    this.ticketForm.get('address.state')?.setValue(stateCode);

    try {
      this.cities = await this.locationService.getCities(state.uf)
      cityControl?.enable();
      const match = this.cities.find(c => normalizeText(c.name) === normalizeText(data.city));
      cityControl?.setValue(match ? match.name : null);
      if (!match) {
        this.cepError = "Cidade não encontrada na lista oficial. Selecione manualmente.";
      }
    } catch (err) {
      console.error("Erro ao carregar cidades do estado:", err)
      cityControl?.disable();
      this.cepLoading = false;
    }
  }

  private async getCategories(): Promise<void> {
    try {
      this.categories = await this.categoryService.getAll();
    } catch (err) {
      console.error("Erro ao buscar categorias")
      this.categories = [];
    } finally {
      this.cdr.detectChanges();
    }
  }

  public async saveTicket(): Promise<void> {
    if (this.ticketForm.invalid) {
      this.ticketForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    const value = this.ticketForm.getRawValue();

    const dto = {
      title: value.title,
      description: value.description,
      categoryId: Number(value.categoryId),
      address: value.address,
      priceMax: Number(value.priceMax),
      paymentMethods: value.paymentMethods,
      availableDays: value.availableDays,
      availableHours: value.availableHours
    };

    try {
      const createdTicket =
        await this.ticketService.create(dto);

      this.ticketCreated.emit(createdTicket);
      this.toastrService.success("Ticket criado com sucesso")
      this.closeModal();

    } catch (err) {
      console.error(
        'Erro ao criar ticket:',
        err
      );

    } finally {
      this.isSubmitting = false;
      this.cdr.detectChanges();
    }
  }

  private async saveUrgentTicket(
    provider: User
  ): Promise<void> {

    const relevantFields =
      Object.values(this.urgentStepFields).flat();

    const isValid = relevantFields.every(
      field => this.ticketForm.get(field)?.valid
    );

    if (!isValid) {
      relevantFields.forEach(
        field =>
          this.ticketForm
            .get(field)
            ?.markAsTouched()
      );

      return;
    }

    const value = this.ticketForm.getRawValue();

    const dto = {
      title: value.title,
      description: value.description,
      categoryId: Number(value.categoryId),
      address: value.address,
      providerId: provider.id
    };

    await this.ticketService.createUrgent(dto);
  }

  // apenas busca prestadores para a categoria/localização, ainda não cria nada —
  // o ticket urgente só é criado quando o usuário realmente escolher alguém no WhatsApp
  private async searchProvidersForUrgentTicket(): Promise<void> {
    if (this.isSubmitting) return;
    this.isSubmitting = true;

    const value = this.ticketForm.getRawValue();
    const categoryId = Number(value.categoryId);
    const state = value.address.state;
    const city = value.address.city;

    try {
      await this.loadProviders(categoryId, state, city)
      this.currentStep = 3;
    } finally {
      this.isSubmitting = false;
      this.cdr.detectChanges();
    }
  }

  private async loadProviders(
    categoryId: number,
    state: string,
    city: string
  ): Promise<void> {

    try {
      this.providers =
        await this.userService.getProvidersWithUrgency(
          categoryId,
          state,
          city
        );

      if (this.providers.length === 0) {
        console.warn(
          'Nenhum prestador encontrado para os critérios informados.'
        );
      }

    } catch (err) {
      console.error('Erro ao buscar prestadores:', err);
      this.providers = [];

    } finally {
      this.cdr.detectChanges();
    }
  }

  public nextStep(): void {
    if (!this.isStepValid(this.currentStep)) {
      this.markStepAsTouched(this.currentStep);
      return;
    }

    if (this.isUrgent && this.currentStep === 2) {
      this.searchProvidersForUrgentTicket();
      return;
    }

    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
    }
  }

  public prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
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

  public async openWhatsapp(
    provider: User
  ): Promise<void> {

    this.sendingProviderId = provider.id;

    try {
      await this.saveUrgentTicket(provider);

      const message =
        `Olá ${provider.name}, vi seu perfil e preciso de um atendimento urgente.`;

      const url =
        `https://wa.me/${provider.phone}?text=${encodeURIComponent(message)}`;

      window.open(url, '_blank');

      this.closeModal();

    } catch (err) {
      console.error(
        'Erro ao criar ticket urgente:',
        err
      );

    } finally {
      this.sendingProviderId = null;
      this.cdr.detectChanges();
    }
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
    this.providers = [];
    this.cities = [];
    this.isSubmitting = false;
    this.sendingProviderId = null;
    this.cepError = null;
    this.cepLoading = false;

    this.ticketForm.reset();

    this.ticketForm.get('paymentMethods')?.setValue([]);
    this.ticketForm.get('availableDays')?.setValue([]);
    this.ticketForm.get('availableHours')?.setValue([]);

    this.ticketForm.get('address.city')?.disable();

    this.cdr.detectChanges();
  }
}