import { Component, OnInit, inject } from '@angular/core';
import { AuthLayout } from "../../../shared/components/auth-layout/auth-layout";
import { RouterLink } from '@angular/router';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LocationService, Estado, Cidade } from '../../../services/location/location';

export interface RegisterRequest {
  nome: string;
  email: string;
  senha: string;
  confirmarSenha: string;

  telefone: string;
  cpf: string;
  dataNascimento: string;
  estado: string;
  cidade: string;

  isPrestador: boolean;

  categoria?: string;
  descricao?: string;
}

function senhasIguaisValidator(group: AbstractControl) {
  const senha = group.get('senha')?.value;
  const confirmar = group.get('confirmarSenha')?.value;
  return senha === confirmar ? null : { senhasDivergentes: true };
}

@Component({
  selector: 'app-sign-up',
  imports: [AuthLayout, RouterLink, ReactiveFormsModule],
  templateUrl: './sign-up.html',
  styleUrl: './sign-up.css',
})
export class SignUp implements OnInit {
  private locationService = inject(LocationService);

  currentStep = 1;

  estados: Estado[] = [];
  cidades: Cidade[] = [];

  maxDate: string = new Date().toISOString().split('T')[0];

  registerForm = new FormGroup(
    {
      nome: new FormControl('', Validators.required),
      email: new FormControl('', [Validators.required, Validators.email]),
      senha: new FormControl('', [Validators.required, Validators.minLength(6)]),
      confirmarSenha: new FormControl('', Validators.required),

      telefone: new FormControl('', Validators.required),
      cpf: new FormControl('', Validators.required),
      dataNascimento: new FormControl('', Validators.required),
      estado: new FormControl('', Validators.required),
      cidade: new FormControl({ value: '', disabled: true }, Validators.required),

      isPrestador: new FormControl(false),

      categoria: new FormControl(''),
      descricao: new FormControl(''),
    },
    { validators: senhasIguaisValidator }
  );

  ngOnInit() {
    this.locationService.getEstados()
      .subscribe(data => this.estados = data);

    this.registerForm.get('isPrestador')?.valueChanges
      .subscribe(isPrestador => {
        this.atualizarValidatorsPrestador(isPrestador ?? false);
      });

    this.atualizarValidatorsPrestador(this.registerForm.get('isPrestador')?.value ?? false);
  }

  private atualizarValidatorsPrestador(isPrestador: boolean) {
    const categoria = this.registerForm.get('categoria');
    const descricao = this.registerForm.get('descricao');

    if (isPrestador) {
      categoria?.setValidators([Validators.required]);
      descricao?.setValidators([Validators.required]);
    } else {
      categoria?.clearValidators();
      descricao?.clearValidators();
    }

    categoria?.updateValueAndValidity();
    descricao?.updateValueAndValidity();
  }

  onEstadoChange() {
    const nomeEstado = this.registerForm.get('estado')?.value;
    const estado = this.estados.find(e => e.nome === nomeEstado);
    if (!estado) return;

    this.cidades = [];
    this.registerForm.get('cidade')?.disable();

    this.locationService.getCidades(estado.id).subscribe(data => {
      this.cidades = data;
      this.registerForm.get('cidade')?.enable();
    });
  }

  get isPrestador(): boolean {
    return this.registerForm.get('isPrestador')?.value ?? false;
  }

  abrirCalendario(input: HTMLInputElement) {
    if (typeof input.showPicker === 'function') {
      try {
        input.showPicker();
      } catch {
        // navegador sem suporte a showPicker em certos contextos
      }
    }
  }

  // Marca os campos como "touched" para que as mensagens de erro apareçam
  private marcarCamposComoTocados(fields: string[]) {
    fields.forEach(field => this.registerForm.get(field)?.markAsTouched());
  }

  nextStep() {
    if (this.currentStep === 1) {
      const fields = ['nome', 'email', 'senha', 'confirmarSenha'];
      this.marcarCamposComoTocados(fields);

      const invalid = fields.some(field => this.registerForm.get(field)?.invalid);
      if (invalid) return;

      if (this.registerForm.hasError('senhasDivergentes')) return;
    }

    if (this.currentStep === 2) {
      const fields = ['telefone', 'cpf', 'dataNascimento', 'estado', 'cidade'];
      this.marcarCamposComoTocados(fields);

      const invalid = fields.some(field => this.registerForm.get(field)?.invalid);
      if (invalid) return;
    }

    this.currentStep++;
  }

  prevStep() {
    this.currentStep--;
  }

  onRegister() {
    if (this.registerForm.invalid) return;

    const payload: RegisterRequest = this.registerForm.getRawValue() as RegisterRequest;
    console.log(payload);
  }
}