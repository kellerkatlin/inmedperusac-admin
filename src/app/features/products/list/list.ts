import { ApiResponse } from '@/core/models/api-response.model';
import { AttributeResponse, AttributeValueResponse } from '@/core/models/attribute.model';
import { CategoryResponse } from '@/core/models/category.mode.';
import { ProductResponse } from '@/core/models/product.model';
import { AttributeValueService } from '@/core/service/api/attribute-value.service';
import { AttributeService } from '@/core/service/api/attribute.service';
import { CategoryService } from '@/core/service/api/category.service';
import { ProductService } from '@/core/service/api/product.service';
import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
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
import { ListboxModule } from 'primeng/listbox';
import { RippleModule } from 'primeng/ripple';
import { SelectModule } from 'primeng/select';
import { Table, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { BehaviorSubject, forkJoin, map } from 'rxjs';
import { TextareaModule } from 'primeng/textarea';

import { Editor } from 'primeng/editor';

type AttrId = number;

function plainTextLengthValidator(opts: { min?: number; max?: number }) {
    return (control: AbstractControl): ValidationErrors | null => {
        const html: string = control.value ?? '';
        const text = html
            .replace(/<[^>]+>/g, '')
            .replace(/\s+/g, ' ')
            .trim(); // quita tags y normaliza espacios
        const len = text.length;

        if (opts.min && len < opts.min) return { minPlainText: true };
        if (opts.max && len > opts.max) return { maxPlainText: true };
        return null;
    };
}

@Component({
    selector: 'app-list',
    imports: [
        CommonModule,
        TableModule,
        ButtonModule,
        RippleModule,
        ToastModule,
        ToolbarModule,
        Editor,
        TextareaModule,
        InputTextModule,
        InputNumberModule,
        DialogModule,
        TagModule,
        SelectModule,
        CardModule,
        ListboxModule,
        ConfirmDialogModule,
        ReactiveFormsModule,
        ImageModule,
        IconFieldModule,
        InputIconModule
    ],
    templateUrl: './list.html'
})
export class List {
    // services
    private readonly productService = inject(ProductService);
    private readonly categoryService = inject(CategoryService);
    private readonly attributeService = inject(AttributeService);
    private readonly attributeValueService = inject(AttributeValueService);
    private readonly confirmationService = inject(ConfirmationService);
    private readonly messageService = inject(MessageService);
    private readonly fb = inject(NonNullableFormBuilder);

    // ===== Estado de selección por atributo =====

    /** Cache: attributeId -> valores */

    /** Mapa de selección actual: attributeId -> ids de valores seleccionados */

    /** Control temporal para el listbox del atributo activo */

    /** Stream para valores del atributo activo (UI) */
    selectedAttributeId = this.fb.control<number | null>(null);
    currentAttrValueIds = this.fb.control<number[]>([]);

    currentAttributeValues$ = new BehaviorSubject<AttributeValueResponse[]>([]);
    private valuesCache = new Map<AttrId, AttributeValueResponse[]>();
    selectedByAttribute = new Map<AttrId, number[]>();

    maxDescriptionPlainChars = 4000;
    descriptionPlainLength = 0;

    // state
    productDialog = false;
    loading = false;
    submitted = false;

    products = signal<ProductResponse[]>([]);
    selectedProducts: ProductResponse[] | null = null;
    product: ProductResponse | null = null;

    categories = signal<CategoryResponse[]>([]);
    attributes = signal<AttributeResponse[]>([]);
    attributeValues = signal<AttributeValueResponse[]>([]); // todos los valores (de todos los atributos)

    // imágenes seleccionadas (nuevas)
    imageFiles: File[] = [];
    imagePreviews: string[] = [];

    statusOptions = [
        { name: 'Activo', code: 'ACTIVO' },
        { name: 'Inactivo', code: 'INACTIVO' }
    ];

    // ====== FORM ======
    form: FormGroup<{
        categoryId: FormControl<number | null>; // UI en number, al enviar se castea a string
        description: FormControl<string>;
        price: FormControl<number>;
        tittle: FormControl<string>;
        status: FormControl<string>;
        attributeValueIds: FormControl<number[]>; // múltiples ids
    }> = this.fb.group({
        categoryId: this.fb.control<number | null>(null, { validators: [Validators.required] }),
        tittle: this.fb.control(''),
        description: ['', [Validators.required, plainTextLengthValidator({ min: 10, max: this.maxDescriptionPlainChars })]],
        price: this.fb.control(0, { validators: [Validators.required, Validators.min(0)] }),
        status: this.fb.control('ACTIVO', { validators: [Validators.required] }),
        attributeValueIds: this.fb.control<number[]>([], { validators: [] })
    });

    ngOnInit() {
        this.loadProducts();

        this.selectedAttributeId.valueChanges.subscribe((attrId) => {
            this.onSelectAttribute(attrId ?? null);
        });
    }

    // ====== LOADERS ======
    loadProducts() {
        this.loading = true;
        this.productService.get().subscribe({
            next: (res) => {
                const list: ProductResponse[] = res.data ?? res; // tolera objeto/array
                this.products.set(list);
                this.loading = false;
            },
            error: (err) => {
                this.toastError(err, 'No se pudo cargar productos');
            }
        });
    }

    loadCategories() {
        this.categoryService.get().subscribe({
            next: (res) => {
                this.categories.set(res.data ?? res);
            },
            error: (err) => {
                this.toastError(err, 'No se pudieron cargar categorías');
            }
        });
    }

    /**
     * Carga TODOS los AttributeValue llamando al backend.
     * Si tu endpoint exige attributeId como query param,
     * primero trae atributos y luego hace forkJoin(getByAttribute(attr.id)) y concatena.
     */
    loadAttributeValues(preselectedIds?: number[]) {
        this.attributeService.get().subscribe({
            next: (res) => {
                const attrs: AttributeResponse[] = res.data ?? res;
                this.attributes.set(attrs);

                if (!attrs?.length) {
                    this.attributeValues.set([]);
                    return;
                }

                // Para cada atributo, traigo valores y les agrego attributeId
                const calls = attrs.map((a) =>
                    this.attributeValueService.get(a.id).pipe(
                        map((r: ApiResponse<AttributeValueResponse[]>) => {
                            const values = (r?.data ?? []).map((v) => ({ ...v, attributeId: a.id }) as any);
                            // guarda cache por atributo para getValueObj(...)
                            this.valuesCache.set(a.id, values);
                            return values;
                        })
                    )
                );

                forkJoin(calls).subscribe({
                    next: (arrs: AttributeValueResponse[][]) => {
                        const flat = arrs.flat();
                        this.attributeValues.set(flat);

                        // ---- reconstruir mapa seleccionado por atributo ----
                        if (preselectedIds?.length) {
                            const byAttr = new Map<number, number[]>();

                            preselectedIds.forEach((vid) => {
                                const v: any = flat.find((x) => x.id === vid);
                                if (!v || v.attributeId == null) return;
                                const aId = v.attributeId as number;
                                const list = byAttr.get(aId) ?? [];
                                list.push(vid);
                                byAttr.set(aId, list);
                            });

                            this.selectedByAttribute = byAttr;
                            this.syncFormAttributeValueIds();

                            // si hay atributo activo, precarga su selección en el listbox
                            const curAttr = this.selectedAttributeId.value;
                            if (curAttr) {
                                this.currentAttrValueIds.setValue([...(this.selectedByAttribute.get(curAttr) ?? [])]);
                            }
                        }
                    },
                    error: (err) => this.toastError(err, 'No se pudieron cargar valores de atributos')
                });
            },
            error: (err) => this.toastError(err, 'No se pudieron cargar atributos')
        });
    }

    // ====== UI helpers ======
    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
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

    avLabel(v: AttributeValueResponse) {
        // Construye una etiqueta legible según el tipo de valor disponible
        if (v.valueString != null && v.valueString !== '') return v.valueString;
        if (typeof v.valueNumber === 'number') return String(v.valueNumber);
        if (typeof v.valueBoolean === 'boolean') return v.valueBoolean ? 'True' : 'False';
        return `#${v.id}`;
    }

    // ====== CRUD ======
    openNew() {
        this.product = null;
        this.submitted = false;

        this.loadCategories();
        this.loadAttributeValues(); // sin preselección

        this.form.reset({
            categoryId: null,
            description: '',
            price: 0,
            status: 'ACTIVO',
            attributeValueIds: []
        });

        this.selectedByAttribute.clear();
        this.selectedAttributeId.setValue(null, { emitEvent: false });
        this.currentAttrValueIds.setValue([], { emitEvent: false });

        this.imageFiles = [];
        this.imagePreviews = [];
        this.productDialog = true;
    }

    loadAttributesBase() {
        this.attributeService.get().subscribe({
            next: (res) => this.attributes.set(res.data ?? res),
            error: (err) => this.toastError(err, 'No se pudieron cargar atributos')
        });
    }

    editProduct(p: ProductResponse) {
        this.product = { ...p };
        this.submitted = false;

        this.loadCategories();

        const ids = (p.productAttributes ?? []).map((pa) => pa.attributeValue?.id).filter(Boolean) as number[];

        // Esto reconstruirá selectedByAttribute (ver tu loadAttributeValues(preselectedIds))
        this.loadAttributeValues(ids);

        this.form.patchValue({
            categoryId: p.category?.id ?? null,
            description: p.description ?? '',
            tittle: p.tittle ?? '',
            price: p.price ?? 0,
            status: p.status ?? 'ACTIVO',
            attributeValueIds: ids
        });

        this.imageFiles = [];
        this.imagePreviews = (p.productImages ?? []).map((img) => img.image).filter(Boolean);

        this.productDialog = true;
    }

    addCurrentSelection() {
        const attrId = this.selectedAttributeId.value;
        if (!attrId) {
            this.toastWarn('Primero selecciona un atributo');
            return;
        }
        const tempIds = this.currentAttrValueIds.value ?? [];
        const already = this.selectedByAttribute.get(attrId) ?? [];

        // merge sin duplicados
        const final = Array.from(new Set([...already, ...tempIds]));
        this.selectedByAttribute.set(attrId, final);

        // sincroniza el control global que envías al backend
        this.syncFormAttributeValueIds();

        // limpia selección temporal del listbox
        this.currentAttrValueIds.setValue([], { emitEvent: false });
    }

    /** cuántas previews corresponden a imágenes existentes del producto */
    private get existingPreviewCount(): number {
        return this.product?.productImages?.length ?? 0;
    }

    /** se puede eliminar solo lo nuevo (no lo existente del backend) */
    canRemovePreview(index: number): boolean {
        return index >= this.existingPreviewCount;
    }

    /** elimina una foto de la previsualización (solo nuevas) */
    removePreviewAt(index: number) {
        if (!this.canRemovePreview(index)) {
            // es una imagen existente del producto -> no se elimina aquí
            return;
        }
        const newIdx = index - this.existingPreviewCount; // índice dentro de los nuevos
        this.imageFiles.splice(newIdx, 1);
        this.imagePreviews.splice(index, 1);
    }

    hideDialog() {
        this.productDialog = false;
        this.submitted = false;
        this.product = null;
        this.form.reset();
        this.imageFiles = [];
        this.imagePreviews = [];
    }

    onSelectAttribute(attrId: AttrId | null) {
        if (!attrId) {
            this.currentAttributeValues$.next([]);
            this.currentAttrValueIds.setValue([]);
            return;
        }

        const setFromConfirmed = () => {
            // precargar lo confirmado (si hay) en el listbox
            const confirmed = this.selectedByAttribute.get(attrId) ?? [];
            this.currentAttrValueIds.setValue([...confirmed], { emitEvent: false });
        };

        if (this.valuesCache.has(attrId)) {
            this.currentAttributeValues$.next(this.valuesCache.get(attrId)!);
            setFromConfirmed();
            return;
        }

        this.attributeValueService.get(attrId).subscribe({
            next: (res) => {
                const values = res.data ?? [];
                this.valuesCache.set(attrId, values);
                this.currentAttributeValues$.next(values);
                setFromConfirmed();
            },
            error: (err) => this.toastError(err, 'No se pudieron cargar valores del atributo')
        });
    }

    onCurrentAttrSelectionChange(ids: number[]) {
        const attrId = this.selectedAttributeId.value;
        if (!attrId) return;
        this.selectedByAttribute.set(attrId, [...ids]);
        this.syncFormAttributeValueIds();
    }
    removeSelectedValue(attrId: AttrId, valueId: number) {
        const cur = this.selectedByAttribute.get(attrId) ?? [];
        const next = cur.filter((id) => id !== valueId);
        this.selectedByAttribute.set(attrId, next);
        this.syncFormAttributeValueIds();

        if (this.selectedAttributeId.value === attrId) {
            // refleja lo confirmado en el listbox solo si estás en ese atributo
            this.currentAttrValueIds.setValue([...next], { emitEvent: false });
        }
    }

    clearAttributeSelection(attrId: AttrId) {
        this.selectedByAttribute.delete(attrId);
        this.syncFormAttributeValueIds();

        if (this.selectedAttributeId.value === attrId) {
            this.currentAttrValueIds.setValue([], { emitEvent: false });
        }
    }

    private syncFormAttributeValueIds() {
        const unique = Array.from(new Set(Array.from(this.selectedByAttribute.values()).flat()));
        this.form.controls.attributeValueIds.setValue(unique);
    }
    /**
     * Helper para mostrar el nombre del atributo por id.
     */
    attrName(attrId: AttrId): string {
        const a = this.attributes().find((x) => x.id === attrId);
        return a?.name ?? `Atributo ${attrId}`;
    }

    /**
     * Helper para encontrar el objeto del valor por id en cache (para label).
     */
    getValueObj(attrId: AttrId, valueId: number): AttributeValueResponse | undefined {
        const list = this.valuesCache.get(attrId) || [];
        return list.find((v) => v.id === valueId);
    }
    deleteProduct(p: ProductResponse) {
        this.confirmationService.confirm({
            key: 'confirm',
            message: '¿Eliminar el producto: ' + p.description + '?',
            header: 'Confirmación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí',
            rejectLabel: 'No',
            accept: () => {
                this.productService.delete(p.id).subscribe({
                    next: (res) => {
                        this.products.set(this.products().filter((it) => it.id !== p.id));
                        this.toastOk(res?.message || 'Producto eliminado correctamente');
                    },
                    error: (err) => this.toastError(err, 'No se pudo eliminar el producto')
                });
            }
        });
    }

    // ====== Imágenes (multi) ======
    onImagesChange(evt: Event) {
        const input = evt.target as HTMLInputElement;
        const files = Array.from(input.files ?? []);
        if (!files.length) return;

        this.imageFiles.push(...files);
        // Previews nuevas
        files.forEach((file) => {
            const reader = new FileReader();
            reader.onload = () => {
                this.imagePreviews.push(String(reader.result));
            };
            reader.readAsDataURL(file);
        });

        input.value = '';
    }

    removeNewImageAt(index: number) {
        // quita imagen nueva (no toca las que vinieron de backend)
        const existingPreviewCount = this.product?.productImages?.length ?? 0;
        const previewIdx = existingPreviewCount + index;
        this.imageFiles.splice(index, 1);
        this.imagePreviews.splice(previewIdx, 1);
    }

    onEditorChange(e: any) {
        const html: string = e?.htmlValue ?? this.form.controls.description.value ?? '';
        const text = html.replace(/<[^>]+>/g, '').trim();
        this.descriptionPlainLength = text.length;
        this.form.controls.description.updateValueAndValidity({ onlySelf: true, emitEvent: false });
    }

    // ====== Guardar (create/update) ======
    saveProduct() {
        this.submitted = true;
        if (this.form.invalid) return;

        this.loading = true;
        const v = this.form.getRawValue();

        // Construir FormData (POST/PUT)
        const fd = new FormData();
        fd.append('categoryId', String(v.categoryId ?? ''));
        fd.append('description', v.description ?? '');
        fd.append('tittle', v.tittle ?? '');
        fd.append('price', String(v.price ?? '')); // backend espera string
        fd.append('status', v.status ?? 'ACTIVO');

        // attributeValueIds como string (p.ej. "1,2,3")
        const avIds = (v.attributeValueIds ?? []).join(',');
        fd.append('attributeValueIds', avIds);

        // múltiples imágenes (mismo campo 'images')
        for (const file of this.imageFiles) {
            fd.append('images', file, file.name);
        }

        const finalize = () => {
            this.loading = false;
            this.productDialog = false;
            this.submitted = false;
            this.form.reset();
            this.imageFiles = [];
            this.imagePreviews = [];
        };

        if (this.product?.id) {
            // UPDATE
            this.productService.update(this.product.id, fd).subscribe({
                next: (res) => {
                    const updated: ProductResponse = Array.isArray(res.data) ? res.data[0] : res.data;
                    if (!updated) {
                        this.toastWarn('El servidor no retornó el producto actualizado');
                        this.loading = false;
                        return;
                    }
                    this.products.set(this.products().map((it) => (it.id === updated.id ? updated : it)));
                    this.toastOk(res?.message || 'Producto actualizado correctamente');
                    finalize();
                },
                error: (err) => this.toastError(err, 'No se pudo actualizar el producto')
            });
        } else {
            // CREATE
            this.productService.create(fd).subscribe({
                next: (res) => {
                    const created: ProductResponse = Array.isArray(res.data) ? res.data[0] : res.data;
                    if (!created) {
                        this.toastWarn('El servidor no retornó el producto creado');
                        this.loading = false;
                        return;
                    }
                    this.products.set([...this.products(), created]);
                    this.toastOk(res?.message || 'Producto creado correctamente');
                    finalize();
                },
                error: (err) => this.toastError(err, 'No se pudo crear el producto')
            });
        }
    }

    // ====== Toast helpers ======
    private toastOk(detail: string) {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail, life: 3000 });
    }
    private toastWarn(detail: string) {
        this.messageService.add({ severity: 'warn', summary: 'Atención', detail, life: 3000 });
    }
    private toastError(err: any, fallback: string) {
        this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err?.error?.message || fallback,
            life: 3000
        });
        this.loading = false;
    }
}
