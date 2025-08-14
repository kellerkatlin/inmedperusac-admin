import { ApiResponse } from '@/core/models/api-response.model';
import { CompanyResponse } from '@/core/models/company.model';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environments';

@Injectable({ providedIn: 'root' })
export class CompanyService {
    private readonly _http = inject(HttpClient);
    private readonly _baseUrl = `${environment.apiBaseUrl}/company`;

    getCompany(): Observable<ApiResponse<CompanyResponse[]>> {
        return this._http.get<ApiResponse<CompanyResponse[]>>(this._baseUrl);
    }

    updateCompany(id: number, formData: FormData): Observable<ApiResponse<CompanyResponse>> {
        return this._http.put<ApiResponse<CompanyResponse>>(`${this._baseUrl}/${id}`, formData);
    }
}
