import { CompanyService } from '@/core/service/api/company.service';
import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { ImageModule } from 'primeng/image';
import { InputTextModule } from 'primeng/inputtext';
import { RippleModule } from 'primeng/ripple';
import { TabsModule } from 'primeng/tabs';
import { TextareaModule } from 'primeng/textarea';
import { ToolbarModule } from 'primeng/toolbar';
import { CompanyResponse } from '@/core/models/company.model';
import { SelectModule } from 'primeng/select';
import { MessageService } from 'primeng/api';

@Component({
    selector: 'app-company',
    imports: [CommonModule, ReactiveFormsModule, SelectModule, CardModule, ButtonModule, InputTextModule, TextareaModule, AutoCompleteModule, ImageModule, TabsModule, ToolbarModule, DividerModule, RippleModule],
    templateUrl: './company.html'
})
export class Company {
    private readonly companyService = inject(CompanyService);
    private readonly fb = inject(NonNullableFormBuilder);
    private readonly messageService = inject(MessageService);
    missionFile?: File | null;
    visionFile?: File | null;

    company = signal<CompanyResponse>({
        id: 0,
        domain: '',
        identityTypeCode: '6',
        identityDocument: '',
        name: '',
        businessName: '',
        address: '',
        email: '',
        summary: '',
        missionDescription: '',
        missionImage: '',
        visionDescription: '',
        visionImage: '',
        status: 'ACTIVE'
    });

    placeholder = 'https://via.placeholder.com/800x600.png?text=Vista+previa';

    identityTypes = [
        { label: 'RUC', value: 'RUC' },
        { label: 'DNI', value: 'DNI' },
        { label: 'PASAPORTE', value: 'PASS' }
    ];

    form: FormGroup = this.fb.group({
        domain: ['', [Validators.required, Validators.maxLength(120)]],
        identityDocument: ['', [Validators.required, Validators.maxLength(20)]],
        name: ['', [Validators.required, Validators.maxLength(150)]],
        identityTypeCode: ['6'],
        businessName: ['', [Validators.required, Validators.maxLength(200)]],
        address: ['', [Validators.required, Validators.maxLength(250)]],
        email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
        summary: [''],
        missionDescription: [''],
        missionImage: [''],
        visionDescription: [''],
        visionImage: [''],
        status: ['ACTIVE', Validators.required]
    });

    ngOnInit() {
        this.companyService.getCompany().subscribe({
            next: (res) => {
                let data = res.data[0];
                this.company.set(data);
                this.form.patchValue(data);
                this.form.markAsDirty();
            }
        });
    }

    isInvalid(control: string): boolean {
        const c = this.form.get(control);
        return !!(c && c.invalid && (c.dirty || c.touched));
    }

    // helpers (en tu clase)
    private mimeToExt(mime: string): string {
        switch (mime) {
            case 'image/jpeg':
                return 'jpg';
            case 'image/png':
                return 'png';
            case 'image/webp':
                return 'webp';
            case 'image/gif':
                return 'gif';
            default:
                return 'bin';
        }
    }
    private fixedFilename(file: File, base: 'missionImage' | 'visionImage'): string {
        const extFromName = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : '';
        const ext = extFromName || this.mimeToExt(file.type);
        return `${base}.${ext}`;
    }

    onImageChange(evt: Event, controlName: 'missionImage' | 'visionImage') {
        const input = evt.target as HTMLInputElement;
        const file = input.files?.[0] ?? null;
        if (!file) return;

        // preview con base64
        const reader = new FileReader();
        reader.onload = () => {
            // Solo para vista previa, no para enviar al backend
            this.form.get(controlName)?.setValue(reader.result as string);
            this.form.get(controlName)?.markAsDirty();
            this.form.markAsDirty();

            // Guardar archivo real para el PUT
            if (controlName === 'missionImage') this.missionFile = file;
            if (controlName === 'visionImage') this.visionFile = file;

            // Limpiar input para permitir misma imagen después
            input.value = '';
        };
        reader.readAsDataURL(file);
    }

    onSubmit() {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const companyId = this.company().id;
        const dto = this.form.getRawValue();

        const formData = new FormData();

        Object.entries(dto).forEach(([key, value]) => {
            if (key !== 'missionImage' && key !== 'visionImage') {
                // Only append string or Blob, convert objects to JSON string
                if (typeof value === 'object' && value !== null) {
                    formData.append(key, JSON.stringify(value));
                } else {
                    formData.append(key, value != null ? String(value) : '');
                }
            }
        });

        if (this.missionFile) {
            formData.append(
                'missionImage',
                this.missionFile,
                this.fixedFilename(this.missionFile, 'missionImage') // <-- filename fijo
            );
        }
        if (this.visionFile) {
            formData.append(
                'visionImage',
                this.visionFile,
                this.fixedFilename(this.visionFile, 'visionImage') // <-- filename fijo
            );
        }

        this.companyService.updateCompany(companyId, formData).subscribe({
            next: (res) => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: res.message,
                    life: 3000
                });
                this.form.markAsPristine();
            },
            error: (res) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudieron guardar los cambios',
                    life: 3000
                });
            }
        });
    }

    onCancel() {}
}
