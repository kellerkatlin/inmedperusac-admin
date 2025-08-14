import { ApiResponse } from '@/core/models/api-response.model';
import { CategoryResponse } from '@/core/models/category.mode.';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environments';

@Injectable({ providedIn: 'root' })
export class CategoryService {
    private readonly _http = inject(HttpClient);
    private readonly _baseUrl = `${environment.apiBaseUrl}/category`;

    get(): Observable<ApiResponse<CategoryResponse[]>> {
        return this._http.get<ApiResponse<CategoryResponse[]>>(this._baseUrl);
    }

    update(id: number, formData: FormData): Observable<ApiResponse<CategoryResponse[]>> {
        return this._http.put<ApiResponse<CategoryResponse[]>>(`${this._baseUrl}/${id}`, formData);
    }

    create(formData: FormData): Observable<ApiResponse<CategoryResponse[]>> {
        return this._http.post<ApiResponse<CategoryResponse[]>>(`${this._baseUrl}`, formData);
    }

    delete(id: number): Observable<ApiResponse<void>> {
        return this._http.delete<ApiResponse<void>>(`${this._baseUrl}/${id}`);
    }
}
