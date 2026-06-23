import { createReducer, on } from '@ngrx/store';
import { AuthState, initialAuthState } from './auth.state';
import * as AuthActions from './auth.actions';

export const authReducer = createReducer(
  initialAuthState,

  // LOGIN
  on(AuthActions.login, (state) => ({
    ...state,
    isLoading: true,
    error: null,
  })),
  on(AuthActions.loginSuccess, (state, { accessToken, refreshToken, usuario }) => ({
    ...state,
    isLoading: false,
    isAuthenticated: true,
    accessToken,
    refreshToken,
    usuario,
    error: null,
  })),
  on(AuthActions.loginFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    isAuthenticated: false,
    error,
  })),

  // REGISTER
  on(AuthActions.register, (state) => ({
    ...state,
    isLoading: true,
    error: null,
  })),
  on(AuthActions.registerSuccess, (state, { accessToken, refreshToken, usuario }) => ({
    ...state,
    isLoading: false,
    isAuthenticated: true,
    accessToken,
    refreshToken,
    usuario,
    error: null,
  })),
  on(AuthActions.registerFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    error,
  })),

  // LOGOUT
  on(AuthActions.logout, AuthActions.logoutSuccess, () => ({
    ...initialAuthState,
  })),

  // REFRESH TOKEN
  on(AuthActions.refreshTokenSuccess, (state, { accessToken, refreshToken }) => ({
    ...state,
    accessToken,
    refreshToken,
    isAuthenticated: true,
  })),
  on(AuthActions.refreshTokenFailure, () => ({
    ...initialAuthState,
  })),

  // CARGAR DESDE STORAGE
  on(AuthActions.loadAuthFromStorageSuccess, (state, { accessToken, refreshToken, usuario }) => ({
    ...state,
    accessToken,
    refreshToken,
    usuario,
    isAuthenticated: true,
  })),

  // LIMPIAR ERROR
  on(AuthActions.clearError, (state) => ({
    ...state,
    error: null,
  })),
);