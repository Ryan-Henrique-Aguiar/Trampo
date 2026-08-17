import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { AuthLayout } from "../../../shared/components/auth-layout/auth-layout";
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
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

  categories: Category[] = [];
  states: State[] = [];
  cities: City[] = [];

  // campos que pertencem a cada step, usado tanto pra navegação quanto pra travar os botões
  private stepFields: Record<number, string[]> = {
    1: ['name', 'email', 'password'],
    2: ['phone', 'cpf', 'state', 'city'],
    3: ['categoryIds'],
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
      email: new FormControl('', [Validators.required, Validators.email]),
      phone: new FormControl('', Validators.required),
      cpf: new FormControl('', Validators.required),
      state: new FormControl('', Validators.required),
      city: new FormControl({ value: '', disabled: true }, Validators.required),
      provider: new FormControl(false),
      categoryIds: new FormControl<number[]>([]),
    });
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
  }

  private updateProviderValidators(provider: boolean): void {
    const categoryIds = this.registerForm.get('categoryIds');
    if (provider) {
      categoryIds?.setValidators([Validators.required]);
    } else {
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
    return fields.every((field) => this.registerForm.get(field)?.valid);
  }

  nextStep(): void {
    if (!this.isStepValid(this.currentStep)) return;
    this.currentStep++;
  }

  prevStep(): void {
    this.currentStep--;
  }

async onRegister(): Promise<void> {
  if (this.registerForm.invalid || this.loading) {
    this.registerForm.markAllAsTouched();
    return;
  }

  this.loading = true;
  this.errorMsg = '';
  this.cdr.detectChanges();

  const dto: RegisterRequestDto = {
    name: this.registerForm.value.name!,
    email: this.registerForm.value.email!,
    password: this.registerForm.value.password!,
    cpf: this.registerForm.value.cpf!,
    phone: this.registerForm.value.phone!,
    provider: this.registerForm.value.provider!,
    city: this.registerForm.value.city!,
    state: this.registerForm.value.state!,
    categoryIds: this.registerForm.value.categoryIds ?? []
  };

  try {
    await this.authService.register(dto);

    this.toastrService.success(
      'Conta criada com sucesso!'
    );

    await this.router.navigate(['/login']);

  } catch (err: any) {
    console.error('Erro ao cadastrar:', err);

    const message =
      err.error?.message ?? 'Erro ao cadastrar usuário';

    this.errorMsg = message;

    this.toastrService.error(message);

  } finally {
    this.loading = false;
    this.cdr.detectChanges();
  }
}
}