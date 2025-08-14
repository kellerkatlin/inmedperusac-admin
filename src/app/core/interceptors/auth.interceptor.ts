import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { TokenService } from '../service/token.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const tokenService = inject(TokenService);
    const router = inject(Router);

    const token = tokenService.getToken();
    const isApiUrl = req.url.startsWith('https://catalog.arianjosafat.com');

    if (isApiUrl) {
        let headers = req.headers.set('X-Company', '1');

        if (token) {
            headers = headers.set('Authorization', `Bearer ${token}`);
        }

        req = req.clone({ headers });
    }

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401 || error.status === 403) {
                tokenService.clearToken();
                router.navigate(['/auth/login']);
            }
            return throwError(() => error);
        })
    );
};
