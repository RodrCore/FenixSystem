import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { AuthService } from '../../features/auth/services/auth.service';
import * as AuthActions from '../../store/auth/auth.actions';
import { throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';

// Estado compartido del refresh (fuera de la función para ser singleton)
let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const authService = inject(AuthService);
  const store = inject(Store);

  // ✅ Agregar token si existe
  const token = authService.getAccessToken();
  const authReq = token ? addToken(req, token) : req;

  return next(authReq).pipe(
    catchError((error) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        return handle401Error(req, next, authService, store);
      }
      return throwError(() => error);
    }),
  );
};

function addToken(
  req: HttpRequest<any>,
  token: string,
): HttpRequest<any> {
  return req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });
}

function handle401Error(
  req: HttpRequest<any>,
  next: HttpHandlerFn,
  authService: AuthService,
  store: Store,
) {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    const refreshToken = authService.getRefreshToken();
    const usuario = authService.getUsuario();

    if (refreshToken && usuario) {
      return authService.refreshToken(refreshToken, usuario.id).pipe(
        switchMap((response: any) => {
          isRefreshing = false;
          authService.saveTokens(response.accessToken, response.refreshToken);
          refreshTokenSubject.next(response.accessToken);
          return next(addToken(req, response.accessToken));
        }),
        catchError((err) => {
          isRefreshing = false;
          authService.clearTokens();
          store.dispatch(AuthActions.logout());
          return throwError(() => err);
        }),
      );
    } else {
      isRefreshing = false;
      authService.clearTokens();
      store.dispatch(AuthActions.logout());
      return throwError(() => new Error('No refresh token available'));
    }
  }

  return refreshTokenSubject.pipe(
    filter((token) => token !== null),
    take(1),
    switchMap((token) => next(addToken(req, token!))),
  );
}