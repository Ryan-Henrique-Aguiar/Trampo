import { Component } from '@angular/core';
import { AuthLayout } from "../../../shared/components/auth-layout/auth-layout";
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-sign-in',
  imports: [AuthLayout, RouterLink],
  templateUrl: './sign-in.html',
  styleUrl: './sign-in.css',
})
export class SignIn {}
