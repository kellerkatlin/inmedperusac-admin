import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    template: `<ul class="layout-menu">
        <ng-container *ngFor="let item of model; let i = index">
            <li app-menuitem *ngIf="!item.separator" [item]="item" [index]="i" [root]="true"></li>
            <li *ngIf="item.separator" class="menu-separator"></li>
        </ng-container>
    </ul> `
})
export class AppMenu {
    model: MenuItem[] = [];

    ngOnInit() {
        this.model = [
            // {
            //     label: 'Home',
            //     items: [
            //         { label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/'] },
            //         {
            //             label: 'Configuracion',
            //             icon: 'pi pi-fw pi-cog',
            //             items: [
            //                 {
            //                     label: 'Empresa',
            //                     icon: 'pi pi-fw pi-building',
            //                     routerLink: ['/settings/company']
            //                 }
            //             ]
            //         }
            //     ]
            // },
            {
                label: 'Productos',
                items: [
                    { label: 'Listado', icon: 'pi pi-list', routerLink: ['/products'] },
                    { label: 'Categorías', icon: 'pi pi-sitemap', routerLink: ['/products/categories'] },
                    {
                        label: 'Atributos',
                        icon: 'pi pi-sliders-h',
                        routerLink: ['/products/attributes']
                    }
                ]
            },
            {
                label: 'Empresa',
                icon: 'pi pi-building',
                items: [
                    { label: 'Empresa', icon: 'pi pi-briefcase', routerLink: ['/settings/company'] }
                    // { label: 'Valores', icon: 'pi pi-verified', routerLink: ['/company-values'] },
                    // { label: 'Redes sociales', icon: 'pi pi-share-alt', routerLink: ['/company-social'] },
                    // { label: 'Teléfonos', icon: 'pi pi-phone', routerLink: ['/company-phones'] }
                ]
            },
            // {
            //     label: 'Catálogos',
            //     icon: 'pi pi-database',
            //     items: [{ label: 'Redes Sociales', icon: 'pi pi-hashtag', routerLink: ['/social-networks'] }]
            // },
            {
                label: 'General',
                items: [{ label: 'Consultas', icon: 'pi pi-id-card', routerLink: ['/general/messages'] }]
            }
        ];
    }
}
