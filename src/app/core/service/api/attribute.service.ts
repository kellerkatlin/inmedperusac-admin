import { ApiResponse } from '@/core/models/api-response.model';
import { AttributeRequest, AttributeResponse } from '@/core/models/attribute.model';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environments';

@Injectable({ providedIn: 'root' })
export class AttributeService {
    private readonly _http = inject(HttpClient);
    private readonly _baseUrl = `${environment.apiBaseUrl}/attribute`;

    get(): Observable<ApiResponse<AttributeResponse[]>> {
        return this._http.get<ApiResponse<AttributeResponse[]>>(this._baseUrl);
    }

    update(id: number, formData: AttributeRequest): Observable<ApiResponse<AttributeResponse[]>> {
        return this._http.put<ApiResponse<AttributeResponse[]>>(`${this._baseUrl}/${id}`, formData);
    }

    create(formData: AttributeRequest): Observable<ApiResponse<AttributeResponse[]>> {
        return this._http.post<ApiResponse<AttributeResponse[]>>(`${this._baseUrl}`, formData);
    }

    delete(id: number): Observable<ApiResponse<void>> {
        return this._http.delete<ApiResponse<void>>(`${this._baseUrl}/${id}`);
    }
}
