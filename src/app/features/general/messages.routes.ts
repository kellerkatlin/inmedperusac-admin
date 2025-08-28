import { Routes } from '@angular/router';
import { Messages } from './messages/messages';

export default [
    { path: '', component: Messages },
    { path: 'messages', component: Messages }
] as Routes;
