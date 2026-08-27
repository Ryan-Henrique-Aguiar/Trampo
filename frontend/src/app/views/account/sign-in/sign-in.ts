import {
  ChangeDetectorRef,
  Component
} from '@angular/core';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  ActivatedRoute,
  Router,
  RouterLink
} from '@angular/router';

import { AuthLayout } from '../../../shared/components/auth-layout/auth-layout';
import { AuthService } from '../../../services/auth/auth';
import { LoginRequestDto } from '../../../dto/auth/login-request';
import { ToastrService } from '@iqx-limited/ngx-toastr';

@Component({
  selector: 'app-sign-in',
  imports: [
    AuthLayout,
    RouterLink,
    ReactiveFormsModule
  ],
  templateUrl: './sign-in.html',
  styleUrl: './sign-in.css',
})
export class SignIn {

  loginForm;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private toastrService: ToastrService
  ) {
    this.loginForm = this.fb.group({
      email: [
        '',
        [
          Validators.required,
          Validators.email
        ]
      ],
      password: [
        '',
        [Validators.required]
      ]
    });
  }

  async onSubmit(): Promise<void> {
  if (this.loginForm.invalid || this.loading) {
    this.loginForm.markAllAsTouched();
    return;
  }

  this.loading = true;
  this.cdr.detectChanges();

  const dto: LoginRequestDto = {
    email: this.loginForm.value.email!,
    password: this.loginForm.value.password!
  };

  try {
    await this.authService.login(dto);

    this.toastrService.success('Login realizado com sucesso!');

    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/home';
    await this.router.navigateByUrl(returnUrl);

  } catch (err: any) {
    const message = err.error?.message ?? 'Erro ao realizar login';

    this.toastrService.error(message);
  } finally {
    this.loading = false;
    this.cdr.detectChanges();
  }
}
}
