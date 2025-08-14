import { CategoryResponse } from '@/core/models/category.mode.';
import { CategoryService } from '@/core/service/api/category.service';
import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, FormsModule, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { ImageModule } from 'primeng/image';
import { InputIconModule } from 'primeng/inputicon';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { RadioButtonModule } from 'primeng/radiobutton';
import { RatingModule } from 'primeng/rating';
import { RippleModule } from 'primeng/ripple';
import { SelectModule } from 'primeng/select';
import { Table, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';

@Component({
    selector: 'app-categories',
    imports: [
        CommonModule,
        TableModule,
        FormsModule,
        ButtonModule,
        RippleModule,
        ToastModule,
        ToolbarModule,
        RatingModule,
        InputTextModule,
        TextareaModule,
        RadioButtonModule,
        InputNumberModule,
        DialogModule,
        TagModule,
        InputIconModule,
        IconFieldModule,
        ReactiveFormsModule,
        ConfirmDialogModule,
        SelectModule,
        CardModule,
        ImageModule
    ],
    templateUrl: './categories.html'
})
export class Categories {
    private readonly categoryService = inject(CategoryService);
    private readonly confirmationService = inject(ConfirmationService);
    private readonly messageService = inject(MessageService);
    private readonly fb = inject(NonNullableFormBuilder);

    categoryDialog = false;

    categories = signal<CategoryResponse[]>([]);

    statusOptions = [
        { name: 'Activo', code: 'ACTIVE' },
        { name: 'Inactivo', code: 'INACTIVE' }
    ];

    category: CategoryResponse | null = null;
    selectedCategories: CategoryResponse[] | null = null;

    loading = false;
    submitted = false;
    labelRefresh = 'Actualizar';

    imageFile?: File | null; // archivo real a enviar
    placeholder = 'https://via.placeholder.com/120x80.png?text=Imagen';

    form: FormGroup<{
        description: FormControl<string>;
        status: FormControl<string>;
        image: FormControl<string>; // preview (base64 o url)
    }> = this.fb.group({
        description: this.fb.control('', [Validators.required, Validators.minLength(3)]),
        status: this.fb.control('ACTIVE', Validators.required),
        image: this.fb.control('')
    });

    ngOnInit() {
        this.getCategory();
    }

    getCategory() {
        this.loading = true;
        this.categoryService.get().subscribe({
            next: (res) => {
                // res.data: CategoryResponse[]
                this.categories.set(res.data);
                this.loading = false;
            },
            error: (err) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: err?.error?.message || 'No se pudo cargar categorías',
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
        this.form.reset();
        this.form.patchValue({ status: 'ACTIVE', image: '' });
        this.submitted = false;
        this.categoryDialog = true;
        this.category = null;
        this.imageFile = null;
    }

    editCategory(category: CategoryResponse) {
        this.form.patchValue({
            description: category.description,
            status: category.status,
            image: category.image || '' // para preview si viene url
        });
        this.category = { ...category };
        this.imageFile = null; // si el usuario no cambia, no se envía
        this.categoryDialog = true;
    }

    hideDialog() {
        this.categoryDialog = false;
        this.submitted = false;
        this.category = null;
        this.imageFile = null;
        this.form.reset();
    }

    deleteCategory(category: CategoryResponse) {
        this.confirmationService.confirm({
            key: 'confirm',
            message: '¿Estás seguro(a) de eliminar la categoría: ' + category.description + '?',
            header: 'Confirmación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí',
            rejectLabel: 'No',
            accept: () => {
                this.categoryService.delete(category.id).subscribe({
                    next: (res) => {
                        this.categories.set(this.categories().filter((val) => val.id !== category.id));
                        this.category = null;
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Éxito',
                            detail: res?.message || 'Categoría eliminada correctamente',
                            life: 3000
                        });
                    },
                    error: (err) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: err?.error?.message || 'No se pudo eliminar la categoría',
                            life: 3000
                        });
                    }
                });
            }
        });
    }

    getSeverity(status: string) {
        switch ((status || '').toUpperCase()) {
            case 'ACTIVE':
                return 'success';
            case 'INACTIVE':
                return 'warn';
            default:
                return 'info';
        }
    }

    // helpers imagen
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
    private fixedFilename(file: File, base: 'image'): string {
        const extFromName = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : '';
        const ext = extFromName || this.mimeToExt(file.type);
        return `${base}.${ext}`;
    }

    onImageChange(evt: Event) {
        const input = evt.target as HTMLInputElement;
        const file = input.files?.[0] ?? null;
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            this.form.get('image')?.setValue(reader.result as string); // solo preview
            this.form.get('image')?.markAsDirty();
            this.imageFile = file; // archivo real
            input.value = '';
        };
        reader.readAsDataURL(file);
    }

    saveCategory() {
        this.submitted = true;
        if (this.form.invalid) return;

        this.loading = true;

        const values = this.form.getRawValue();
        const formData = new FormData();

        formData.append('description', values.description ?? '');
        formData.append('status', values.status ?? 'ACTIVE');

        if (this.imageFile) {
            formData.append('image', this.imageFile, this.fixedFilename(this.imageFile, 'image'));
        }

        const finalize = () => {
            this.loading = false;
            this.categoryDialog = false;
            this.submitted = false;
            this.form.reset();
            this.imageFile = null;
        };

        if (this.category?.id) {
            // UPDATE
            this.categoryService.update(this.category.id, formData).subscribe({
                next: (res) => {
                    // soporta ambos: objeto o array
                    const updated: CategoryResponse | undefined = Array.isArray(res.data) ? res.data[0] : res.data;

                    if (!updated) {
                        this.messageService.add({
                            severity: 'warn',
                            summary: 'Atención',
                            detail: 'El servidor no retornó la categoría actualizada',
                            life: 3000
                        });
                        this.loading = false;
                        return;
                    }

                    this.categories.set(this.categories().map((val) => (val.id === updated.id ? updated : val)));

                    this.messageService.add({
                        severity: 'success',
                        summary: 'Éxito',
                        detail: res.message || 'Categoría actualizada correctamente',
                        life: 3000
                    });
                    finalize();
                },
                error: (err) => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: err?.error?.message || 'No se pudo actualizar la categoría',
                        life: 3000
                    });
                    this.loading = false;
                }
            });
        } else {
            // CREATE
            this.categoryService.create(formData).subscribe({
                next: (res) => {
                    const created: CategoryResponse | undefined = Array.isArray(res.data) ? res.data[0] : res.data;

                    if (!created) {
                        this.messageService.add({
                            severity: 'warn',
                            summary: 'Atención',
                            detail: 'El servidor no retornó la categoría creada',
                            life: 3000
                        });
                        this.loading = false;
                        return;
                    }

                    this.categories.set([...this.categories(), created]);

                    this.messageService.add({
                        severity: 'success',
                        summary: 'Éxito',
                        detail: res.message || 'Categoría creada correctamente',
                        life: 3000
                    });
                    finalize();
                },
                error: (err) => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: err?.error?.message || 'No se pudo crear la categoría',
                        life: 3000
                    });
                    this.loading = false;
                }
            });
        }
    }
}
