import { Routes } from '@angular/router';

import { SignIn } from './views/account/sign-in/sign-in';
import { SignUp } from './views/account/sign-up/sign-up';
import { Home } from './pages/home/home';
import { Main } from './pages/main/main';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },

  {
    path: 'login',
    component: SignIn
  },

  {
    path: 'register',
    component: SignUp
  },

  {
    path: 'home',
    component: Home
  },

  {
    path: 'main',
    component: Main
  },

  {
    path: '**',
    redirectTo: 'login'
  }
];