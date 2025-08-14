import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { TokenService } from './token.service';
import { tap } from 'rxjs';
import { environment } from 'src/environments/environments';
import { AuthResponse } from '../models/auth.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private readonly _http = inject(HttpClient);
    private readonly _tokenService = inject(TokenService);
    private readonly _baseUrl = `${environment.apiBaseUrl}/auth/login`;

    login(email: string, password: string) {
        const body = { email, password }; // JSON

        return this._http.post<ApiResponse<AuthResponse>>(this._baseUrl, body).pipe(
            tap((res) => {
                console.log(res);
                if (res.data.token) {
                    this._tokenService.setToken(res.data.token);
                }
            })
        );
    }
}
