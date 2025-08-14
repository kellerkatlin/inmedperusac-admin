import { Routes } from '@angular/router';
import { List } from './list/list';
import { Categories } from './categories/categories';
import { Attributes } from './attributes/attributes';

export default [
    { path: '', component: List },
    { path: 'categories', component: Categories },
    { path: 'attributes', component: Attributes }
] as Routes;
