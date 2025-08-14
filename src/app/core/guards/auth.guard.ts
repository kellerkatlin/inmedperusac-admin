import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TokenService } from '../service/token.service';

export const authGuard: CanActivateFn = (route, state) => {
    const tokenService = inject(TokenService);
    const router = inject(Router);

    const token = tokenService.getToken();
    if (token) {
        return true;
    }

    return router.createUrlTree(['/auth/login']);
};
