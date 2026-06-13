import { Component, OnInit, inject } from '@angular/core';
import { AuthLayout } from "../../../shared/components/auth-layout/auth-layout";
import { RouterLink } from '@angular/router';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LocationService, Cidade, Estado } from '../../../services/location/location';

@Component({
  selector: 'app-sign-up',
  imports: [AuthLayout, RouterLink, FormsModule, ReactiveFormsModule],
  templateUrl: './sign-up.html',
  styleUrl: './sign-up.css',
})
export class SignUp implements OnInit {
  private locationService = inject(LocationService);

  // Location
  estadoControl = new FormControl('');
  cidadeControl = new FormControl({ value: '', disabled: true });
  estados: Estado[] = [];
  cidades: Cidade[] = [];

  // Steps
  isPrestador = false;
  currentStep = 1;

  ngOnInit() {
    this.locationService.getEstados().subscribe(data => this.estados = data);
  }

  onEstadoChange() {
    const estado = this.estados.find(e => e.nome === this.estadoControl.value);
    if (!estado) return;

    this.cidades = [];
    this.cidadeControl.disable();

    this.locationService.getCidades(estado.id).subscribe(data => {
      this.cidades = data;
      this.cidadeControl.enable();
    });
  }

  nextStep() {
    if (this.currentStep === 2 && !this.isPrestador) return;
    this.currentStep++;
  }

  prevStep() {
    this.currentStep--;
  }
  
}