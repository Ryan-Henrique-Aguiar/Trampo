import { Routes } from '@angular/router';

import { SignIn } from './views/account/sign-in/sign-in';
import { SignUp } from './views/account/sign-up/sign-up';

import { Main } from './views/pages/main/main';
import { Home } from './views/pages/home/home';
import { Tickets } from './views/pages/tickets/tickets';
import { Categories } from './views/pages/categories/categories';

import { authGuard } from './guards/auth-guard';

export const routes: Routes = [

  // Rotas públicas
  {
    path: 'login',
    component: SignIn
  },
  {
    path: 'register',
    component: SignUp
  },

  // Rotas autenticadas
  {
    path: '',
    component: Main,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        component: Home
      },
      {
        path: 'tickets',
        component: Tickets
      },
      {
        path: 'categories',
        component: Categories
      }
    ]
  },

  // Qualquer rota inexistente
  {
    path: '**',
    redirectTo: ''
  }
];