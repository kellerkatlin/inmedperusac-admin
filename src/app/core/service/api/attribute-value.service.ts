import { ApiResponse } from '@/core/models/api-response.model';
import { AttributeValueRequest, AttributeValueResponse } from '@/core/models/attribute.model';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environments';

@Injectable({ providedIn: 'root' })
export class AttributeValueService {
    private readonly _http = inject(HttpClient);
    private readonly _baseUrl = `${environment.apiBaseUrl}/attribute-value`;

    get(attributeId: number): Observable<ApiResponse<AttributeValueResponse[]>> {
        return this._http.get<ApiResponse<AttributeValueResponse[]>>(this._baseUrl, {
            params: { attributeId: attributeId.toString() }
        });
    }

    update(id: number, formData: AttributeValueRequest): Observable<ApiResponse<AttributeValueResponse[]>> {
        return this._http.put<ApiResponse<AttributeValueResponse[]>>(`${this._baseUrl}/${id}`, formData);
    }

    create(formData: AttributeValueRequest): Observable<ApiResponse<AttributeValueResponse[]>> {
        return this._http.post<ApiResponse<AttributeValueResponse[]>>(`${this._baseUrl}`, formData);
    }

    delete(id: number): Observable<ApiResponse<void>> {
        return this._http.delete<ApiResponse<void>>(`${this._baseUrl}/${id}`);
    }
}
