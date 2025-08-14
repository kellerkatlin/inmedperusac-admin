import { Routes } from '@angular/router';
import { Company } from './company/company';

export default [
    { path: '', redirectTo: 'company', pathMatch: 'full' },
    { path: 'company', component: Company }
] as Routes;
