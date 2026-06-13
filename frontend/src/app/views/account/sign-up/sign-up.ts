import { Component } from '@angular/core';
import { AuthLayout } from "../../../shared/components/auth-layout/auth-layout";
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-sign-up',
  imports: [AuthLayout, RouterLink],
  templateUrl: './sign-up.html',
  styleUrl: './sign-up.css',
})
export class SignUp {}
