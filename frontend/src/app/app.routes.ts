import { Routes } from '@angular/router';

import { SignIn } from './views/account/sign-in/sign-in';
import { SignUp } from './views/account/sign-up/sign-up';
import { Main } from './views/pages/main/main';
import { Home } from './views/pages/home/home';
import { Tickets } from './views/pages/tickets/tickets';

export const routes: Routes = [
  // Rotas públicas (sem sidebar/navbar/footer)
  { path: 'login', component: SignIn },
  { path: 'register', component: SignUp },

  // Rotas internas (com sidebar/navbar/footer)
  {
    path: '',
    component: Main,
    children: [
      { path: '', component: Home},
      { path: 'tickets', component: Tickets }
      // { path: 'perfil', component: Perfil },
    ],
  },

  { path: '**', redirectTo: ''},
];