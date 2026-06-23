import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  return from(auth.ready).pipe(
    switchMap(() => {
      const token = auth.getTokenValue();

      // ✅ Headers base que SIEMPRE se aplican
      const setHeaders: Record<string, string> = {
        'ngrok-skip-browser-warning': 'true',
      };

      // ✅ Agregar Authorization solo si hay token
      if (token) {
        setHeaders['Authorization'] = `Bearer ${token}`;
      }

      return next(req.clone({ setHeaders }));
    }),
  );
};