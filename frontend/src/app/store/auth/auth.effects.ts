import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, catchError, exhaustMap, tap } from 'rxjs/operators';
import * as AuthActions from './auth.actions';
import { AuthService } from '../../features/auth/services/auth.service';

export const loginEffect = createEffect(
  (
    actions$ = inject(Actions),
    authService = inject(AuthService),
  ) =>
    actions$.pipe(
      ofType(AuthActions.login),
      exhaustMap(({ email, password }) =>
        authService.login(email, password).pipe(
          map((response) =>
            AuthActions.loginSuccess({
              accessToken: response.accessToken,
              refreshToken: response.refreshToken,
              usuario: response.usuario,
            }),
          ),
          catchError((error) =>
            of(
              AuthActions.loginFailure({
                error: error?.error?.message || 'Email o contraseña incorrectos',
              }),
            ),
          ),
        ),
      ),
    ),
  { functional: true },
);

export const loginSuccessEffect = createEffect(
  (
    actions$ = inject(Actions),
    authService = inject(AuthService),
    router = inject(Router),
  ) =>
    actions$.pipe(
      ofType(AuthActions.loginSuccess),
      tap(({ accessToken, refreshToken, usuario }) => {
        authService.saveTokens(accessToken, refreshToken);
        authService.saveUsuario(usuario);
        router.navigate(['/dashboard']);
      }),
    ),
  { functional: true, dispatch: false },
);

export const registerEffect = createEffect(
  (
    actions$ = inject(Actions),
    authService = inject(AuthService),
  ) =>
    actions$.pipe(
      ofType(AuthActions.register),
      exhaustMap(({ data }) =>
        authService.register(data).pipe(
          map((response) =>
            AuthActions.registerSuccess({
              accessToken: response.accessToken,
              refreshToken: response.refreshToken,
              usuario: response.usuario,
            }),
          ),
          catchError((error) =>
            of(
              AuthActions.registerFailure({
                error: error?.error?.message || 'Error al registrarse',
              }),
            ),
          ),
        ),
      ),
    ),
  { functional: true },
);

export const registerSuccessEffect = createEffect(
  (
    actions$ = inject(Actions),
    authService = inject(AuthService),
    router = inject(Router),
  ) =>
    actions$.pipe(
      ofType(AuthActions.registerSuccess),
      tap(({ accessToken, refreshToken, usuario }) => {
        authService.saveTokens(accessToken, refreshToken);
        authService.saveUsuario(usuario);
        router.navigate(['/dashboard']);
      }),
    ),
  { functional: true, dispatch: false },
);

export const logoutEffect = createEffect(
  (
    actions$ = inject(Actions),
    authService = inject(AuthService),
    router = inject(Router),
  ) =>
    actions$.pipe(
      ofType(AuthActions.logout),
      tap(() => {
        authService.clearTokens();
        router.navigate(['/login']);
      }),
    ),
  { functional: true, dispatch: false },
);

export const loadAuthFromStorageEffect = createEffect(
  (
    actions$ = inject(Actions),
    authService = inject(AuthService),
  ) =>
    actions$.pipe(
      ofType(AuthActions.loadAuthFromStorage),
      map(() => {
        const accessToken = authService.getAccessToken();
        const refreshToken = authService.getRefreshToken();
        const usuario = authService.getUsuario();

        if (accessToken && refreshToken && usuario) {
          return AuthActions.loadAuthFromStorageSuccess({
            accessToken,
            refreshToken,
            usuario,
          });
        }
        return AuthActions.logoutSuccess();
      }),
    ),
  { functional: true },
);