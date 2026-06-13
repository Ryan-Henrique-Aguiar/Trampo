import { Component } from '@angular/core';
import { AuthLayout } from "../../../shared/components/auth-layout/auth-layout";

@Component({
  selector: 'app-sign-in',
  imports: [AuthLayout],
  templateUrl: './sign-in.html',
  styleUrl: './sign-in.css',
})
export class SignIn {}
