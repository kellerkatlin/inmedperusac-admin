import { ContactResponse } from '@/core/models/contact.model';
import { ContactService } from '@/core/service/api/contact.service';
import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { RippleModule } from 'primeng/ripple';
import { SelectModule } from 'primeng/select';
import { Table, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';

type FilterKind = 'ALL' | 'UNATTENDED' | 'ATTENDED';

@Component({
    selector: 'app-messages',
    imports: [
        CommonModule,
        TableModule,
        FormsModule,
        ButtonModule,
        RippleModule,
        ToastModule,
        ToolbarModule,
        InputTextModule,
        DialogModule,
        TagModule,
        InputIconModule,
        IconFieldModule,
        ReactiveFormsModule,
        ConfirmDialogModule,
        SelectModule,
        CardModule
    ],
    templateUrl: './messages.html'
})
export class Messages {
    private readonly contactService = inject(ContactService);
    private readonly confirmationService = inject(ConfirmationService);
    private readonly messageService = inject(MessageService);

    // state
    loading = false;
    labelRefresh = 'Actualizar';

    contacts = signal<ContactResponse[]>([]);
    filtered = signal<ContactResponse[]>([]);
    selected: ContactResponse[] | null = null;

    // UI
    detailDialog = false;
    viewing: ContactResponse | null = null;

    filterKind: FilterKind = 'UNATTENDED'; // por defecto mostrar no atendidos

    ngOnInit() {
        this.getContacts();
    }

    getContacts() {
        this.loading = true;
        this.contactService.get().subscribe({
            next: (res) => {
                // res.data: ContactResponse[]
                this.contacts.set(res.data ?? []);
                this.applyFilter();
                this.loading = false;
            },
            error: (err) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: err?.error?.message || 'No se pudieron cargar los contactos',
                    life: 3000
                });
                this.loading = false;
            }
        });
    }

    // Filtro global (search en tabla)
    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    // Filtro por estado (Todos/No atendidos/Atendidos)
    applyFilter() {
        const kind = this.filterKind;
        const data = this.contacts();
        if (kind === 'ALL') {
            this.filtered.set(data);
        } else if (kind === 'UNATTENDED') {
            this.filtered.set(data.filter((c) => !c.isAttended));
        } else {
            this.filtered.set(data.filter((c) => c.isAttended));
        }
    }

    onChangeFilterKind() {
        this.applyFilter();
        this.selected = null;
    }

    // Helpers UI
    getSeverity(isAttended: boolean) {
        return isAttended ? 'success' : 'warn';
    }

    short(text: string, max = 80) {
        if (!text) return '';
        return text.length > max ? text.slice(0, max) + '…' : text;
    }

    // Ver detalle
    openDetail(contact: ContactResponse) {
        this.viewing = contact;
        this.detailDialog = true;
    }

    closeDetail() {
        this.viewing = null;
        this.detailDialog = false;
    }

    // Marcar 1 como atendido
    markAttended(contact: ContactResponse) {
        if (contact.isAttended) return;

        this.confirmationService.confirm({
            key: 'confirm',
            header: 'Confirmación',
            message: `¿Marcar como atendido a ${contact.fullName} (${contact.email})?`,
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí',
            rejectLabel: 'No',
            accept: () => {
                this.loading = true;
                this.contactService.attend(contact.id, true).subscribe({
                    next: (res) => {
                        // actualiza en memoria
                        this.contacts.set(this.contacts().map((c) => (c.id === contact.id ? { ...c, isAttended: true } : c)));
                        this.applyFilter();
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Éxito',
                            detail: res?.message || 'Contacto marcado como atendido',
                            life: 2500
                        });
                        this.loading = false;
                        // si estaba en el diálogo, refleja cambio
                        if (this.viewing?.id === contact.id) {
                            this.viewing = { ...contact, isAttended: true };
                        }
                    },
                    error: (err) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: err?.error?.message || 'No se pudo actualizar el contacto',
                            life: 3000
                        });
                        this.loading = false;
                    }
                });
            }
        });
    }

    // Marcar varios como atendidos
    markSelectedAsAttended() {
        if (!this.selected?.length) return;

        const targets = this.selected.filter((c) => !c.isAttended);
        if (!targets.length) {
            this.messageService.add({
                severity: 'info',
                summary: 'Sin cambios',
                detail: 'Todos los seleccionados ya están atendidos',
                life: 2500
            });
            return;
        }

        this.confirmationService.confirm({
            key: 'confirm',
            header: 'Confirmación',
            message: `¿Marcar ${targets.length} contacto(s) como atendido(s)?`,
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí',
            rejectLabel: 'No',
            accept: async () => {
                this.loading = true;

                // Ejecutar en serie o en paralelo según tu API (aquí simple en paralelo)
                const requests = targets.map((t) => this.contactService.attend(t.id, true));
                Promise.all(requests.map((r) => r.toPromise()))
                    .then(() => {
                        // refrescar en memoria
                        const updatedIds = new Set(targets.map((t) => t.id));
                        this.contacts.set(this.contacts().map((c) => (updatedIds.has(c.id) ? { ...c, isAttended: true } : c)));
                        this.applyFilter();
                        this.selected = null;

                        this.messageService.add({
                            severity: 'success',
                            summary: 'Éxito',
                            detail: 'Contactos marcados como atendidos',
                            life: 2500
                        });
                        this.loading = false;
                    })
                    .catch((err) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: err?.error?.message || 'Ocurrió un error al actualizar algunos contactos',
                            life: 3000
                        });
                        this.loading = false;
                    });
            }
        });
    }

    // Conteo de no atendidos (para badge o toolbar)
    get unattendedCount() {
        return this.contacts().filter((c) => !c.isAttended).length;
    }
}
