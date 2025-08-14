import { Routes } from '@angular/router';
import { guestGuard } from '@/core/guards/guest.guard';
import { Login } from './login/login';

export default [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'login', component: Login, canActivate: [guestGuard] }
] as Routes;
