import { inject, Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';

@Injectable({
    providedIn: 'root'
})
export class TokenService {
    private readonly _TOKEN_KEY = 'access_token';
    private readonly _cookies = inject(CookieService);

    setToken(token: string) {
        this._cookies.set(this._TOKEN_KEY, token, { path: '/', sameSite: 'Lax' });
    }
    getToken() {
        return this._cookies.get(this._TOKEN_KEY);
    }
    clearToken() {
        this._cookies.delete(this._TOKEN_KEY);
    }
}
