import { ApiResponse } from '@/core/models/api-response.model';
import { ProductResponse } from '@/core/models/product.model';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environments';

@Injectable({ providedIn: 'root' })
export class ProductService {
    private readonly _http = inject(HttpClient);
    private readonly _baseUrl = `${environment.apiBaseUrl}/product`;

    get(): Observable<ApiResponse<ProductResponse[]>> {
        return this._http.get<ApiResponse<ProductResponse[]>>(this._baseUrl);
    }

    update(id: number, formData: FormData): Observable<ApiResponse<ProductResponse[]>> {
        return this._http.put<ApiResponse<ProductResponse[]>>(`${this._baseUrl}/${id}`, formData);
    }

    create(formData: FormData): Observable<ApiResponse<ProductResponse[]>> {
        return this._http.post<ApiResponse<ProductResponse[]>>(`${this._baseUrl}`, formData);
    }

    delete(id: number): Observable<ApiResponse<void>> {
        return this._http.delete<ApiResponse<void>>(`${this._baseUrl}/${id}`);
    }
}
