import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { AuthLayout } from "../../../shared/components/auth-layout/auth-layout";
import { Router, RouterLink } from '@angular/router';
import { AbstractControl, FormBuilder, FormControl, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { LocationService, State, City } from '../../../services/location/location';
import { AuthService } from '../../../services/auth/auth';
import { RegisterRequestDto } from '../../../dto/auth/register-request.dto';
import { Category } from '../../../models/category.model';
import { CategoryService } from '../../../services/category/category-service';
import { NgSelectModule } from '@ng-select/ng-select';
import { ToastrService } from '@iqx-limited/ngx-toastr';

@Component({
  selector: 'app-sign-up',
  imports: [AuthLayout, RouterLink, ReactiveFormsModule, NgSelectModule],
  templateUrl: './sign-up.html',
  styleUrl: './sign-up.css',
})
export class SignUp implements OnInit {
  registerForm;

  currentStep = 1;
  errorMsg = '';
  loading = false;
  showPassword = false;
  showRepeatPassword = false;
  fieldErrors: Record<'email' | 'cpf' | 'phone', string> = {
    email: '',
    cpf: '',
    phone: ''
  };

  categories: Category[] = [];
  states: State[] = [];
  cities: City[] = [];

  // campos que pertencem a cada step, usado tanto pra navegação quanto pra travar os botões
  private stepFields: Record<number, string[]> = {
    1: ['name', 'email', 'password', 'repeatPassword', 'phone', 'cpf'],
    2: ['state', 'city', 'categoryIds'],
  };

  constructor(
    private fb: FormBuilder,
    private locationService: LocationService,
    private authService: AuthService,
    private categoryService: CategoryService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private toastrService: ToastrService
  ) {
    this.registerForm = this.fb.group({
      name: new FormControl('', Validators.required),
      password: new FormControl('', [Validators.required, Validators.minLength(6)]),
      repeatPassword: new FormControl('', Validators.required),
      email: new FormControl('', [Validators.required, Validators.email]),
      phone: new FormControl('', [Validators.required, this.exactDigitsValidator(11)]),
      cpf: new FormControl('', [Validators.required, this.exactDigitsValidator(11)]),
      state: new FormControl('', Validators.required),
      city: new FormControl({ value: '', disabled: true }, Validators.required),
      provider: new FormControl(false),
      categoryIds: new FormControl<number[]>([]),
    }, { validators: this.passwordsMatchValidator });
  }

  private passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const repeatPassword = control.get('repeatPassword')?.value;

    return password === repeatPassword ? null : { passwordsMismatch: true };
  }

  async ngOnInit(): Promise<void> {
    try {
      const [states, categories] = await Promise.all([
        this.locationService.getStates(),
        this.categoryService.getAll()
      ]);

      this.states = states;
      this.categories = categories;

    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      this.cdr.detectChanges();
    }

    this.registerForm.get('provider')?.valueChanges.subscribe((provider) => {
      this.updateProviderValidators(provider ?? false);
    });

    this.updateProviderValidators(
      this.registerForm.get('provider')?.value ?? false
    );

    (['email', 'cpf', 'phone'] as const).forEach((field) => {
      this.registerForm.get(field)?.valueChanges.subscribe(() => {
        this.fieldErrors[field] = '';
      });
    });

    this.setupInputMasks();
  }

  private exactDigitsValidator(length: number) {
    return (control: AbstractControl): ValidationErrors | null => {
      const digits = this.onlyDigits(control.value ?? '');

      if (!digits) return null;

      return digits.length === length ? null : { digitLength: true };
    };
  }

  private setupInputMasks(): void {
    const cpfControl = this.registerForm.get('cpf');
    const phoneControl = this.registerForm.get('phone');

    cpfControl?.valueChanges.subscribe((value) => {
      const formattedCpf = this.formatCpf(value ?? '');

      if (value !== formattedCpf) {
        cpfControl.setValue(formattedCpf, { emitEvent: false });
      }
    });

    phoneControl?.valueChanges.subscribe((value) => {
      const formattedPhone = this.formatPhone(value ?? '');

      if (value !== formattedPhone) {
        phoneControl.setValue(formattedPhone, { emitEvent: false });
      }
    });
  }

  private formatCpf(value: string): string {
    const digits = this.onlyDigits(value).slice(0, 11);

    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) {
      return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    }

    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }

  private formatPhone(value: string): string {
    const digits = this.onlyDigits(value).slice(0, 11);

    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;

    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  private onlyDigits(value: string): string {
    return value.replace(/\D/g, '');
  }

  private updateProviderValidators(provider: boolean): void {
    const categoryIds = this.registerForm.get('categoryIds');
    if (provider) {
      categoryIds?.setValidators([Validators.required]);
    } else {
      categoryIds?.setValue([]);
      categoryIds?.clearValidators();
    }

    categoryIds?.updateValueAndValidity();
  }

async onStateChange(): Promise<void> {
  const uf = this.registerForm.get('state')?.value;
  const state = this.states.find(state => state.uf === uf);

  const cityControl = this.registerForm.get('city');

  cityControl?.setValue('');
  cityControl?.disable();

  this.cities = [];

  if (!state) return;

  try {
    this.cities = await this.locationService.getCities(state.uf);
    cityControl?.enable();
  } catch (err) {
    console.error('Erro ao carregar cidades:', err);
  } finally {
    this.cdr.detectChanges();
  }
}

  get isProvider(): boolean {
    return this.registerForm.get('provider')?.value ?? false;
  }

  // usado tanto pra bloquear os botões quanto pro nextStep()
  isStepValid(step: number): boolean {
    const fields = this.stepFields[step];
    if (!fields) return true;

    const fieldsAreValid = fields.every((field) => this.registerForm.get(field)?.valid);
    const passwordsMatch = step !== 1 || !this.registerForm.hasError('passwordsMismatch');
    const fieldsHaveNoServerErrors = step !== 1
      || Object.values(this.fieldErrors).every((message) => !message);

    return fieldsAreValid && passwordsMatch && fieldsHaveNoServerErrors;
  }

  nextStep(): void {
    this.markStepAsTouched(this.currentStep);

    if (!this.isStepValid(this.currentStep)) return;
    this.currentStep++;
  }

  private markStepAsTouched(step: number): void {
    this.stepFields[step]?.forEach((field) => {
      this.registerForm.get(field)?.markAsTouched();
    });
  }

  prevStep(): void {
    this.currentStep--;
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleRepeatPasswordVisibility(): void {
    this.showRepeatPassword = !this.showRepeatPassword;
  }

  private applyFieldError(message: string): boolean {
    const normalizedMessage = message.toLowerCase();
    const field = normalizedMessage.includes('email')
      ? 'email'
      : normalizedMessage.includes('cpf')
        ? 'cpf'
        : normalizedMessage.includes('telefone')
          ? 'phone'
          : null;

    if (!field) return false;

    this.fieldErrors[field] = message;
    this.registerForm.get(field)?.markAsTouched();
    return true;
  }

async onRegister(): Promise<void> {
  if (this.loading) {
    return;
  }

  this.markStepAsTouched(2);

  if (this.registerForm.invalid || !this.isStepValid(2)) return;

  this.loading = true;
  this.errorMsg = '';
  this.cdr.detectChanges();

  const dto: RegisterRequestDto = {
    name: this.registerForm.value.name!,
    email: this.registerForm.value.email!,
    password: this.registerForm.value.password!,
    cpf: this.onlyDigits(this.registerForm.value.cpf!),
    phone: this.onlyDigits(this.registerForm.value.phone!),
    provider: this.registerForm.value.provider!,
    city: this.registerForm.value.city!,
    state: this.registerForm.value.state!,
    categoryIds: this.registerForm.value.categoryIds ?? []
  };

  try {
    const response = await this.authService.register(dto);

    this.toastrService.success(
      response.message
    );

    await this.router.navigate(['/login']);

  } catch (err: any) {
    console.error('Erro ao cadastrar:', err);

    const message =
      err.error?.message ?? 'Erro ao cadastrar usuário';

    this.errorMsg = message;

    if (this.applyFieldError(message)) {
      this.currentStep = 1;
    }

    this.toastrService.error(message);

  } finally {
    this.loading = false;
    this.cdr.detectChanges();
  }
}
}
