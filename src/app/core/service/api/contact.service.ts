import { ApiResponse } from '@/core/models/api-response.model';
import { ContactResponse } from '@/core/models/contact.model';
import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environments';

@Injectable({ providedIn: 'root' })
export class ContactService {
    private readonly _http = inject(HttpClient);
    private readonly _baseUrl = `${environment.apiBaseUrl}/contact`;

    get(): Observable<ApiResponse<ContactResponse[]>> {
        return this._http.get<ApiResponse<ContactResponse[]>>(this._baseUrl);
    }

    update(id: number, formData: FormData): Observable<ApiResponse<ContactResponse[]>> {
        return this._http.put<ApiResponse<ContactResponse[]>>(`${this._baseUrl}/${id}`, formData);
    }

    attend(id: number, isAttended: boolean): Observable<ApiResponse<ContactResponse[]>> {
        const params = new HttpParams().set('isAttended', isAttended);
        return this._http.patch<ApiResponse<ContactResponse[]>>(`${this._baseUrl}/${id}/attend`, {}, { params });
    }
}
