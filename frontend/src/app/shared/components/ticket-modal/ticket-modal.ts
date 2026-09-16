import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';

import { CategoryService } from '../../../services/category/category-service';
import { TicketService } from '../../../services/ticket/ticket-service';
import { UrgentTicketService } from '../../../services/urgent-ticket/urgent-ticket-service';
import { Category } from '../../../models/category.model';
import { UrgentProviderResponse } from '../../../dto/user/urgent-provider-response';
import { PaymentMethod } from '../../../enums/payment-method';
import { UserService } from '../../../services/user/user';
import { LocationService, State, City } from '../../../services/location/location';
import { Ticket} from '../../../models/ticket.model';
import { WeekDay } from '../../../enums/week-day';
import { ToastrService } from '@iqx-limited/ngx-toastr';
import { TicketImageService } from '../../../services/ticket/ticket-image-service';

interface NormalizedCepAddress {
  street?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
}

function normalizeText(value: string | null | undefined): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

@Component({
  selector: 'app-ticket-modal',
  imports: [ReactiveFormsModule, NgSelectModule],
  templateUrl: './ticket-modal.html',
  styleUrl: './ticket-modal.css',
})
export class TicketModal implements OnInit, OnDestroy {
  @Input() isUrgent = false;
  @Input() preselectedCategoryId: number | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() ticketCreated = new EventEmitter<Ticket>();
  categories: Category[] = [];
  currentStep = 1;
  isSubmitting = false;
  providers: UrgentProviderResponse[] = [];
  states: State[] = [];
  cities: City[] = [];
  cepLoading = false;
  cepError: string | null = null;
  sendingProviderId: number | null = null;
  providersError: string | null = null;
  selectedFiles: File[] = [];
  selectedFilePreviews: string[] = [];

  ticketForm!: FormGroup;
  readonly totalSteps = 4;
  readonly maxImages = 5;

  readonly paymentOptions = [
    { label: 'Pix', value: PaymentMethod.PIX },
    { label: 'Crédito', value: PaymentMethod.CREDIT },
    { label: 'Débito', value: PaymentMethod.DEBIT },
    { label: 'Dinheiro', value: PaymentMethod.CASH },
  ];

  readonly dayOptions = [
    { label: 'Segunda', value: WeekDay.MONDAY },
    { label: 'Terça', value: WeekDay.TUESDAY },
    { label: 'Quarta', value: WeekDay.WEDNESDAY },
    { label: 'Quinta', value: WeekDay.THURSDAY },
    { label: 'Sexta', value: WeekDay.FRIDAY },
    { label: 'Sábado', value: WeekDay.SATURDAY },
    { label: 'Domingo', value: WeekDay.SUNDAY },
  ];

  readonly hourOptions = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00', '21:00', '22:00', '23:00',
    '00:00',
  ];

  private readonly stepFields: Record<number, string[]> = {
    1: ['title', 'description', 'categoryId'],
    2: ['address.state', 'address.city', 'address.street', 'address.number', 'address.neighborhood'],
  };
  

  constructor(
    private categoryService: CategoryService,
    private ticketService: TicketService,
    private ticketImageService: TicketImageService,
    private urgentTicketService: UrgentTicketService,
    private userService: UserService,
    private locationService: LocationService,
    private cdr: ChangeDetectorRef,
    private toastrService: ToastrService
  ) { }

  ngOnInit(): void {
    this.initializeForm();
    this.getCategories();
    this.loadStates();

    if (this.preselectedCategoryId != null) {
      this.ticketForm.get('categoryId')?.setValue(this.preselectedCategoryId);
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
        city: new FormControl({ value: null, disabled: true }, [Validators.required]),
        state: new FormControl(null, [Validators.required, Validators.maxLength(2)]),
        zipCode: new FormControl(null),
        complement: new FormControl(null),
      }),
      priceMax: new FormControl(null, [Validators.required, Validators.min(0.01)]),
      paymentMethods: new FormControl([], [Validators.required]),
      availableDays: new FormControl([], [Validators.required]),
      availableHours: new FormControl([], [Validators.required]),
    });
  }

  private async loadStates(): Promise<void> {
    try {
      this.states = await this.locationService.getStates();
    } catch (err) {
      console.error('Erro ao buscar estados:', err);
      this.states = [];
    } finally {
      this.cdr.detectChanges();
    }
  }

   async onStateChange(): Promise<void> {
    const stateCode = this.ticketForm.get('address.state')?.value;
    const state = this.states.find(s => s.uf === stateCode);

    const cityControl = this.ticketForm.get('address.city');
    cityControl?.setValue(null);
    cityControl?.disable();
    this.cities = [];

    if (!state) return;

    try {
      this.cities = await this.locationService.getCities(state.uf);

      cityControl?.enable();
    } catch (err) {
      console.error('Erro ao carregar cidades:', err);
      this.cities = [];
    } finally {
      this.cdr.detectChanges();
    }
  }

  ngOnDestroy(): void {
    this.revokeFilePreviews();
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.setSelectedFiles(input.files ? Array.from(input.files) : []);
  }

  onFilesDropped(event: DragEvent): void {
    event.preventDefault();
    this.setSelectedFiles(event.dataTransfer?.files ? Array.from(event.dataTransfer.files) : []);
  }

  private setSelectedFiles(files: File[]): void {
    if (files.length === 0) {
      return;
    }

    if (files.length > this.maxImages) {
      this.toastrService.warning(
        `Você pode selecionar no máximo ${this.maxImages} imagens.`
      );

      return;
    }

    this.revokeFilePreviews();
    this.selectedFiles = files;
    this.selectedFilePreviews = files.map(file => URL.createObjectURL(file));
  }

  private revokeFilePreviews(): void {
    this.selectedFilePreviews.forEach(preview => URL.revokeObjectURL(preview));
    this.selectedFilePreviews = [];
  }

  formatCep(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');
    if (value.length > 5) {
      value = value.substring(0, 5) + '-' + value.substring(5, 8);
    }
    this.ticketForm.get('address.zipCode')?.setValue(value, { emitEvent: false });
  }

  async onCepBlur(): Promise<void> {
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
      this.cepError = 'Não conseguimos identificar o estado pelo CEP';
      return;
    }
    const state = this.states.find(s => s.uf === stateCode);
    if (!state) {
      cityControl?.disable();
      this.cepError = 'Não conseguimos identificar o estado automaticamente. Selecione manualmente.';
      return;
    }
    this.ticketForm.get('address.state')?.setValue(stateCode);

    try {
      this.cities = await this.locationService.getCities(state.uf);
      cityControl?.enable();
      const match = this.cities.find(c => normalizeText(c.name) === normalizeText(data.city));
      cityControl?.setValue(match ? match.name : null);
      if (!match) {
        this.cepError = 'Cidade não encontrada na lista oficial. Selecione manualmente.';
      }
    } catch (err) {
      console.error('Erro ao carregar cidades do estado:', err);
      cityControl?.disable();
    }
  }

  private async getCategories(): Promise<void> {
    try {
      this.categories = await this.categoryService.getAll();
    } catch (err) {
      console.error('Erro ao buscar categorias', err);
      this.categories = [];
    } finally {
      this.cdr.detectChanges();
    }
  }

  async saveTicket(): Promise<void> {
    if (this.isSubmitting) return;

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
      // Cria o ticket
      const createdTicket =
        await this.ticketService.create(dto);

      // 2. Se houver imagens, faz o upload
      if (this.selectedFiles.length > 0) {

        console.log('Arquivos enviados:', this.selectedFiles.map(file => file.name));

        await this.ticketImageService.uploadImages(
          createdTicket.id,
          this.selectedFiles
        );
        
      }

      this.ticketCreated.emit(createdTicket);
      this.toastrService.success('Serviço criado com sucesso');
      this.closeModal();

    } catch (err) {
      console.error(
        'Erro ao criar ticket:',
        err
      );
      this.toastrService.error('Não foi possível criar o serviço.');
    } finally {
      this.isSubmitting = false;
      this.cdr.detectChanges();
    }
  }

  private async loadProviders(): Promise<void> {
    if (this.isSubmitting) return;

    this.isSubmitting = true;
    this.providersError = null;

    const value = this.ticketForm.getRawValue();

    try {
      this.providers = await this.userService.getProvidersWithUrgency(
        Number(value.categoryId),
        value.address.state,
        value.address.city
      );
    } catch (err) {
      console.error('Erro ao buscar prestadores:', err);
      this.providers = [];
      this.providersError = 'Não foi possível buscar prestadores disponíveis.';
      this.toastrService.error(this.providersError);
    } finally {
      this.currentStep = 3;
      this.isSubmitting = false;
      this.cdr.detectChanges();
    }
  }

  nextStep(): void {
    if (!this.isStepValid(this.currentStep)) {
      this.markStepAsTouched(this.currentStep);
      return;
    }

    if (this.isUrgent && this.currentStep === 2) {
      this.loadProviders();
      return;
    }

    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
    }
  }

  prevStep(): void {
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

  isInvalid(field: string): boolean {
    const control = this.ticketForm.get(field);
    return !!control && control.invalid && control.touched;
  }

  isPaymentSelected(paymentMethod: PaymentMethod): boolean {
    const paymentMethods: PaymentMethod[] =
      this.ticketForm.get('paymentMethods')?.value ?? [];

    return paymentMethods.includes(paymentMethod);
  }

  togglePaymentMethod(paymentMethod: PaymentMethod): void {
    const paymentMethods: PaymentMethod[] =
      this.ticketForm.get('paymentMethods')?.value ?? [];

    const updated = paymentMethods.includes(paymentMethod)
      ? paymentMethods.filter(item => item !== paymentMethod)
      : [...paymentMethods, paymentMethod];

    this.ticketForm.get('paymentMethods')?.setValue(updated);
    this.ticketForm.get('paymentMethods')?.markAsTouched();
  }

  async createUrgentTicket(
    provider: UrgentProviderResponse
  ): Promise<void> {
    if (this.sendingProviderId !== null) return;

    const phone = provider.phone.replace(/\D/g, '');

    if (!phone) {
      this.toastrService.error('O prestador não possui um telefone válido.');
      return;
    }

    const whatsappWindow = window.open('', '_blank');

    if (!whatsappWindow) {
      this.toastrService.error('Permita a abertura de pop-ups para acessar o WhatsApp.');
      return;
    }

    this.sendingProviderId = provider.id;

    try {
      const value = this.ticketForm.getRawValue();

      const dto = {
        title: value.title,
        description: value.description,
        categoryId: Number(value.categoryId),
        address: value.address,
        providerId: provider.id
      };

      await this.urgentTicketService.create(dto);

      const message =
        `Olá ${provider.name}, vi seu perfil e preciso de um atendimento urgente.`;

      const whatsappPhone = phone.length <= 11
        ? `55${phone}`
        : phone;

      const url =
        `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(message)}`;

      whatsappWindow.location.href = url;

      this.toastrService.success('Solicitação criada. Inicie o atendimento após combinar com o prestador.');
      this.closeModal();
    } catch (err) {
      whatsappWindow.close();
      console.error('Erro ao criar ticket urgente:', err);
      this.toastrService.error('Não foi possível criar o serviço urgente.');
    } finally {
      this.sendingProviderId = null;
      this.cdr.detectChanges();
    }
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
    this.providers = [];
    this.providersError = null;
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

  }

}
