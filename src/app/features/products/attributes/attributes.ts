import { AttributeResponse, AttributeValueResponse } from '@/core/models/attribute.model';
import { AttributeValueService } from '@/core/service/api/attribute-value.service';
import { AttributeService } from '@/core/service/api/attribute.service';
import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { RippleModule } from 'primeng/ripple';
import { SelectModule } from 'primeng/select';
import { Table, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { forkJoin, of } from 'rxjs';

type DataType = 'string' | 'number' | 'boolean';
type ValueFormGroup = FormGroup<{
    id: FormControl<number>;
    valueString: FormControl<string>;
    valueNumber: FormControl<number>;
    valueBoolean: FormControl<boolean>;
}>;
@Component({
    selector: 'app-attributes',
    imports: [
        CommonModule,
        TableModule,
        CardModule,
        ButtonModule,
        RippleModule,
        ToastModule,
        ToolbarModule,
        InputTextModule,
        InputNumberModule,
        DialogModule,
        TagModule,
        SelectModule,
        ConfirmDialogModule,
        ReactiveFormsModule,
        IconFieldModule,
        InputIconModule
    ],
    templateUrl: './attributes.html'
})
export class Attributes {
    // services
    private readonly attributeService = inject(AttributeService);
    private readonly attributeValueService = inject(AttributeValueService);
    private readonly confirmationService = inject(ConfirmationService);
    private readonly messageService = inject(MessageService);
    private readonly fb = inject(FormBuilder); // usamos FormBuilder normal para flexibilidad

    // state
    attributeDialog = false;
    loading = false;
    submitted = false;

    attributes = signal<AttributeResponse[]>([]);
    selectedAttributes: AttributeResponse[] | null = null;
    attribute: AttributeResponse | null = null;

    // para diferenciar nuevos/actualizados/eliminados en valores
    private initialValues: AttributeValueResponse[] = [];
    private valuesToDelete: number[] = [];

    statusOptions = [
        { name: 'Activo', code: 'ACTIVO' },
        { name: 'Inactivo', code: 'INACTIVO' }
    ];

    dataTypeOptions: { name: string; code: DataType }[] = [
        { name: 'Texto (STRING)', code: 'string' },
        { name: 'Número (NUMBER)', code: 'number' },
        { name: 'Booleano (BOOLEAN)', code: 'boolean' }
    ];

    // form principal
    form: FormGroup<{
        name: FormControl<string>;
        dataType: FormControl<DataType>;
        status: FormControl<string>;
    }> = this.fb.group({
        name: this.fb.control('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] }),
        dataType: this.fb.control<DataType>('string', { nonNullable: true, validators: [Validators.required] }),
        status: this.fb.control('ACTIVO', { nonNullable: true, validators: [Validators.required] })
    });

    // form array para valores (solo SELECT/MULTISELECT o si decides permitir preset en otros)
    valuesForm: FormArray<ValueFormGroup> = this.fb.array<ValueFormGroup>([]);

    ngOnInit() {
        this.loadAttributes();
    }

    getSeverity(status: string) {
        switch ((status || '').toUpperCase()) {
            case 'ACTIVO':
                return 'success';
            case 'INACTIVO':
                return 'warn';
            default:
                return 'info';
        }
    }

    // CRUD atributos
    loadAttributes() {
        this.loading = true;
        this.attributeService.get().subscribe({
            next: (res) => {
                // res.data: AttributeResponse[]
                this.attributes.set(res.data);
                this.loading = false;
            },
            error: (err) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: err?.error?.message || 'No se pudo cargar atributos',
                    life: 3000
                });
                this.loading = false;
            }
        });
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    openNew() {
        this.attribute = null;
        this.submitted = false;
        this.valuesToDelete = [];
        this.initialValues = [];
        this.form.reset({ name: '', dataType: 'string', status: 'ACTIVO' });
        this.valuesForm.clear();
        this.attributeDialog = true;
    }

    editAttribute(attr: AttributeResponse) {
        this.attribute = { ...attr };
        this.submitted = false;
        this.valuesToDelete = [];

        this.form.patchValue({
            name: attr.name,
            dataType: attr.dataType as DataType,
            status: attr.status
        });

        this.valuesForm.clear();
        this.initialValues = [];

        // SIEMPRE cargar valores del atributo
        this.loading = true;
        this.attributeValueService.get(attr.id).subscribe({
            next: (res) => {
                const values: AttributeValueResponse[] = res.data ?? [];
                this.initialValues = values;
                values.forEach((v) => this.valuesForm.push(this.buildValueRow(v)));
                this.loading = false;
            },
            error: (err) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: err?.error?.message || 'No se pudieron cargar los valores',
                    life: 3000
                });
                this.loading = false;
            }
        });

        this.attributeDialog = true;
    }

    hideDialog() {
        this.attributeDialog = false;
        this.submitted = false;
        this.attribute = null;
        this.valuesForm.clear();
        this.initialValues = [];
        this.valuesToDelete = [];
        this.form.reset();
    }

    deleteAttribute(attr: AttributeResponse) {
        this.confirmationService.confirm({
            key: 'confirm',
            message: '¿Eliminar el atributo: ' + attr.name + '?',
            header: 'Confirmación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí',
            rejectLabel: 'No',
            accept: () => {
                this.attributeService.delete(attr.id).subscribe({
                    next: (res) => {
                        this.attributes.set(this.attributes().filter((a) => a.id !== attr.id));
                        this.attribute = null;
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Éxito',
                            detail: res?.message || 'Atributo eliminado correctamente',
                            life: 3000
                        });
                    },
                    error: (err) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: err?.error?.message || 'No se pudo eliminar el atributo',
                            life: 3000
                        });
                    }
                });
            }
        });
    }

    // ---- Valores (FormArray) ----
    private buildValueRow(v?: Partial<AttributeValueResponse>) {
        return this.fb.group({
            id: this.fb.control(v?.id ?? 0, { nonNullable: true }),
            valueString: this.fb.control((v?.valueString ?? '') as string, { nonNullable: true }),
            valueNumber: this.fb.control((v?.valueNumber ?? 0) as number, { nonNullable: true }),
            valueBoolean: this.fb.control((v?.valueBoolean ?? false) as boolean, { nonNullable: true })
        });
    }

    addValueRow() {
        this.valuesForm.push(this.buildValueRow());
    }

    removeValueRow(index: number) {
        const row = this.valuesForm.at(index).value;
        if (row.id && row.id !== 0) {
            this.valuesToDelete.push(row.id);
        }
        this.valuesForm.removeAt(index);
    }

    // map row -> payload según dataType
    private mapRowToPayload(attributeId: number, dt: DataType, row: any) {
        const base: any = {
            attributeId,
            status: row.status,
            order: row.order
        };
        switch (dt) {
            case 'string':
                return { ...base, valueString: row.valueString, valueNumber: undefined, valueBoolean: undefined };
            case 'number':
                return { ...base, valueNumber: row.valueNumber, valueString: undefined, valueBoolean: undefined };
            case 'boolean':
                return { ...base, valueBoolean: row.valueBoolean, valueString: undefined, valueNumber: undefined };
        }
    }

    // Guardar atributo + (opcionalmente) sus valores
    saveAttribute() {
        this.submitted = true;
        if (this.form.invalid) return;

        this.loading = true;

        const formVal = this.form.getRawValue();
        const dtoAttr = { name: formVal.name, dataType: formVal.dataType, status: formVal.status };

        const finalize = () => {
            this.loading = false;
            this.attributeDialog = false;
            this.submitted = false;
            this.valuesForm.clear();
            this.initialValues = [];
            this.valuesToDelete = [];
            this.form.reset();
        };

        const afterSave = (saved: AttributeResponse) => {
            // Actualiza lista local
            if (this.attribute?.id) {
                this.attributes.set(this.attributes().map((a) => (a.id === saved.id ? saved : a)));
            } else {
                this.attributes.set([...this.attributes(), saved]);
            }

            // Siempre procesa valores (STRING/NUMBER/BOOLEAN)
            const dt = formVal.dataType as DataType;
            const rows = this.valuesForm.getRawValue();

            const creates = rows.filter((r) => !r.id || r.id === 0).map((r) => this.attributeValueService.create(this.mapRowToPayload(saved.id, dt, r)));

            const updates = rows.filter((r) => r.id && r.id !== 0).map((r) => this.attributeValueService.update(r.id, this.mapRowToPayload(saved.id, dt, r)));

            const deletes = this.valuesToDelete.map((id) => this.attributeValueService.delete(id));

            const ops = [...(creates.length ? creates : [of(null)]), ...(updates.length ? updates : [of(null)]), ...(deletes.length ? deletes : [of(null)])];

            forkJoin(ops).subscribe({
                next: () => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Éxito',
                        detail: this.attribute?.id ? 'Atributo y valores actualizados' : 'Atributo y valores creados',
                        life: 3000
                    });
                    finalize();
                },
                error: (err) => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: err?.error?.message || 'No se pudieron guardar los valores',
                        life: 3000
                    });
                    this.loading = false;
                }
            });
        };

        // create / update atributo
        if (this.attribute?.id) {
            this.attributeService.update(this.attribute.id, dtoAttr).subscribe({
                next: (res) => {
                    const updated: AttributeResponse = Array.isArray(res.data) ? res.data[0] : res.data;
                    if (!updated) {
                        this.loading = false;
                        return;
                    }
                    afterSave(updated);
                },
                error: (err) => {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'No se pudo actualizar el atributo', life: 3000 });
                    this.loading = false;
                }
            });
        } else {
            this.attributeService.create(dtoAttr).subscribe({
                next: (res) => {
                    const created: AttributeResponse = Array.isArray(res.data) ? res.data[0] : res.data;
                    if (!created) {
                        this.loading = false;
                        return;
                    }
                    afterSave(created);
                },
                error: (err) => {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'No se pudo crear el atributo', life: 3000 });
                    this.loading = false;
                }
            });
        }
    }
}
