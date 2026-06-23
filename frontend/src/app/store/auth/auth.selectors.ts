import { createSelector, createFeatureSelector } from '@ngrx/store';
import { AuthState } from './auth.state';

export const selectAuthState = createFeatureSelector<AuthState>('auth');

export const selectUsuario = createSelector(
  selectAuthState,
  (state) => state.usuario,
);

export const selectAccessToken = createSelector(
  selectAuthState,
  (state) => state.accessToken,
);

export const selectIsAuthenticated = createSelector(
  selectAuthState,
  (state) => state.isAuthenticated,
);

export const selectIsLoading = createSelector(
  selectAuthState,
  (state) => state.isLoading,
);

export const selectError = createSelector(
  selectAuthState,
  (state) => state.error,
);

export const selectUserRole = createSelector(
  selectAuthState,
  (state) => state.usuario?.rol?.nombre ?? null,
);

export const selectUserPermissions = createSelector(
  selectAuthState,
  (state) => state.usuario?.rol?.permisos ?? {},
);

// Selector de fábrica: ¿tiene el rol X?
export const selectHasRole = (rol: string) =>
  createSelector(selectUserRole, (userRole) => userRole === rol);

// Selector de fábrica: ¿tiene alguno de estos roles?
export const selectHasAnyRole = (roles: string[]) =>
  createSelector(selectUserRole, (userRole) =>
    userRole ? roles.includes(userRole) : false,
  );

// Selector de fábrica: ¿tiene el permiso 'modulo.accion'?
export const selectHasPermission = (permission: string) =>
  createSelector(selectUserPermissions, (permisos) => {
    const [modulo, accion] = permission.split('.');
    return permisos?.[modulo]?.[accion] === true;
  });