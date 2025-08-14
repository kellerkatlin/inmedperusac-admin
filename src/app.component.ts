import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterModule, ConfirmDialog, ToastModule],
    template: ` <p-toast />
        <p-confirmdialog />
        <router-outlet></router-outlet>`
})
export class AppComponent {}
