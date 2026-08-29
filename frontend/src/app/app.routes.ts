import { Routes } from '@angular/router';

import { SignIn } from './views/account/sign-in/sign-in';
import { SignUp } from './views/account/sign-up/sign-up';

import { Main } from './views/pages/main/main';
import { Home } from './views/pages/home/home';
import { Tickets } from './views/pages/tickets/tickets';
import { Categories } from './views/pages/categories/categories';
import { Faq } from './views/pages/faq/faq';

import { authGuard } from './guards/auth-guard';
import { OfCommitment } from './views/pages/of-commitment/of-commitment';
import { Support } from './views/pages/support/support';
import { Contact } from './views/pages/contact/contact';

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
        pathMatch: 'full',
        redirectTo: 'home'
      },
      {
        path: 'home',
        component: Home
      },
      {
        path: 'tickets',
        component: Tickets
      },
      {
        path: 'categories',
        component: Categories
      },

    ]
  },

  { path: 'termo-compromisso', component: OfCommitment },
  { path: 'faq', component: Faq },
  { path: 'suporte', component: Support },
  {
    path: 'contato', component: Contact
  },

  // Qualquer rota inexistente
  {
    path: '**',
    redirectTo: 'home'
  }
];
