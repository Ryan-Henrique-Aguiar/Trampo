import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth/auth';
import { LocationService, State, City } from '../../../services/location/location';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from '@iqx-limited/ngx-toastr';
import { formatCpf, formatPhone, onlyDigits } from '../../../utils/input-mask';

@Component({
  selector: 'app-profile',
  imports: [DecimalPipe, ReactiveFormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile implements OnInit {
  activeModal: 'data' | 'password' | null = null;
  states: State[] = [];
  cities: City[] = [];
  locationError = '';
  isSaving = false;

  dataForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.maxLength(100)]),
    email: new FormControl('', [Validators.required, Validators.email]),
    cpf: new FormControl('', [Validators.required, Validators.minLength(14)]),
    phone: new FormControl('', [Validators.required, Validators.minLength(15)]),
    state: new FormControl('', Validators.required),
    city: new FormControl({ value: '', disabled: true }, Validators.required)
  });

  passwordForm = new FormGroup({
    currentPassword: new FormControl('', Validators.required),
    newPassword: new FormControl('', [Validators.required, Validators.minLength(6)]),
    confirmPassword: new FormControl('', Validators.required)
  });

  constructor(
    public authService: AuthService,
    private locationService: LocationService,
    private toastrService: ToastrService,
    private cdr: ChangeDetectorRef
  ) {
    this.setupInputMasks();
  }

  get user() {
    return this.authService.currentUser;
  }

  async ngOnInit(): Promise<void> {
    try {
      this.states = await this.locationService.getStates();
    } catch {
      this.locationError = 'Não foi possível carregar os estados.';
    } finally {
      this.cdr.detectChanges();
    }
  }

  openDataModal(): void {
    const user = this.user;
    if (!user) return;

    this.cities = user.city ? [{ id: -1, name: user.city }] : [];
    this.dataForm.reset({
      name: user.name,
      email: user.email,
      cpf: formatCpf(user.cpf),
      phone: formatPhone(user.phone),
      state: user.state,
      city: user.city
    });
    this.dataForm.controls.city.disable();
    this.activeModal = 'data';

    if (user.state) this.loadCities(user.state, user.city);
  }

  openPasswordModal(): void {
    this.passwordForm.reset();
    this.activeModal = 'password';
  }

  closeModal(): void {
    this.activeModal = null;
  }

  async onStateChange(): Promise<void> {
    this.locationError = '';
    const uf = this.dataForm.controls.state.value;
    this.dataForm.controls.city.setValue('');
    this.cities = [];
    this.dataForm.controls.city.disable();
    if (uf) await this.loadCities(uf);
  }

  private async loadCities(uf: string, currentCity = ''): Promise<void> {
    try {
      const cities = await this.locationService.getCities(uf);
      if (this.dataForm.controls.state.value !== uf) return;

      const normalize = (name: string) => name.normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
      const selectedCity = cities.find(city => normalize(city.name) === normalize(currentCity));

      this.cities = currentCity && !selectedCity
        ? [{ id: -1, name: currentCity }, ...cities]
        : cities;
      this.dataForm.controls.city.enable();
      this.dataForm.controls.city.setValue(selectedCity?.name ?? currentCity);
    } catch {
      this.locationError = 'Não foi possível carregar as cidades.';
    } finally {
      this.cdr.detectChanges();
    }
  }

  private setupInputMasks(): void {
    const cpfControl = this.dataForm.controls.cpf;
    const phoneControl = this.dataForm.controls.phone;

    cpfControl.valueChanges.subscribe(value => {
      const formatted = formatCpf(value ?? '');
      if (value !== formatted) cpfControl.setValue(formatted, { emitEvent: false });
    });

    phoneControl.valueChanges.subscribe(value => {
      const formatted = formatPhone(value ?? '');
      if (value !== formatted) phoneControl.setValue(formatted, { emitEvent: false });
    });
  }

  async saveData(): Promise<void> {
    this.dataForm.markAllAsTouched();
    if (this.dataForm.invalid || this.isSaving || !this.user) return;

    const original = this.user;
    const data = this.dataForm.getRawValue();
    const name = data.name!.trim();
    const email = data.email!.trim();
    const cpf = onlyDigits(data.cpf!);
    const phone = onlyDigits(data.phone!);
    const state = data.state!;
    const city = data.city!;

    const basicChanged = name !== original.name || email !== original.email
      || cpf !== original.cpf || phone !== original.phone;
    const locationChanged = state !== original.state || city !== original.city;
    if (locationChanged && (this.dataForm.controls.city.disabled || !city)) {
      this.dataForm.controls.city.markAsTouched();
      return;
    }
    if (!basicChanged && !locationChanged) {
      this.closeModal();
      return;
    }

    this.isSaving = true;
    let basicSaved = false;
    try {
      if (basicChanged) {
        await this.authService.updateProfile({ name, email, cpf, phone });
        basicSaved = true;
      }
      if (locationChanged) {
        await this.authService.updateLocation({ state, city });
      }
      this.closeModal();
      this.toastrService.success('Dados atualizados com sucesso.');
    } catch (err) {
      const message = (err as HttpErrorResponse).error?.message ?? 'Não foi possível atualizar seus dados.';
      this.toastrService.error(basicSaved ? `Dados básicos salvos. ${message}` : message);
    } finally {
      this.isSaving = false;
      this.cdr.detectChanges();
    }
  }

  async savePassword(): Promise<void> {
    this.passwordForm.markAllAsTouched();
    if (this.passwordForm.invalid || this.isSaving
      || this.passwordForm.controls.newPassword.value !== this.passwordForm.controls.confirmPassword.value) return;

    this.isSaving = true;
    try {
      const data = this.passwordForm.getRawValue();
      await this.authService.updatePassword({
        currentPassword: data.currentPassword!,
        newPassword: data.newPassword!
      });
      this.closeModal();
      this.toastrService.success('Senha atualizada com sucesso.');
    } catch (err) {
      this.toastrService.error((err as HttpErrorResponse).error?.message ?? 'Não foi possível atualizar sua senha.');
    } finally {
      this.isSaving = false;
      this.cdr.detectChanges();
    }
  }
}
