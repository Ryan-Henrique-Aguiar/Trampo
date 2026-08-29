import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-support',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './support.html',
  styleUrl: './support.css'
})
export class Support {
  sending = false;
  sent = false;

  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      assunto: ['', [Validators.required, Validators.minLength(3)]],
      categoria: ['', Validators.required],
      mensagem: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]]
    });
  }

  get mensagemLength(): number {
    return this.form.get('mensagem')?.value?.length ?? 0;
  }

  campoInvalido(campo: string): boolean {
    const control = this.form.get(campo);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.sending = true;

    setTimeout(() => {
      this.sending = false;
      this.sent = true;
      this.form.reset();

      setTimeout(() => (this.sent = false), 6000);
    }, 900);
  }
}
  