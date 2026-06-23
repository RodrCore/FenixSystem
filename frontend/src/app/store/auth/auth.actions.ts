import { createAction, props } from '@ngrx/store';
import { Usuario } from '../../features/auth/models';
import { RegisterRequest } from '../../features/auth/models';

// LOGIN
export const login = createAction(
  '[Auth] Login',
  props<{ email: string; password: string }>(),
);
export const loginSuccess = createAction(
  '[Auth] Login Success',
  props<{ accessToken: string; refreshToken: string; usuario: Usuario }>(),
);
export const loginFailure = createAction(
  '[Auth] Login Failure',
  props<{ error: string }>(),
);

// REGISTER
export const register = createAction(
  '[Auth] Register',
  props<{ data: RegisterRequest }>(),
);
export const registerSuccess = createAction(
  '[Auth] Register Success',
  props<{ accessToken: string; refreshToken: string; usuario: Usuario }>(),
);
export const registerFailure = createAction(
  '[Auth] Register Failure',
  props<{ error: string }>(),
);

// LOGOUT
export const logout = createAction('[Auth] Logout');
export const logoutSuccess = createAction('[Auth] Logout Success');

// REFRESH TOKEN
export const refreshToken = createAction(
  '[Auth] Refresh Token',
  props<{ refreshToken: string; userId: number }>(),
);
export const refreshTokenSuccess = createAction(
  '[Auth] Refresh Token Success',
  props<{ accessToken: string; refreshToken: string }>(),
);
export const refreshTokenFailure = createAction(
  '[Auth] Refresh Token Failure',
  props<{ error: string }>(),
);

// CARGAR DESDE LOCALSTORAGE
export const loadAuthFromStorage = createAction('[Auth] Load From Storage');
export const loadAuthFromStorageSuccess = createAction(
  '[Auth] Load From Storage Success',
  props<{ accessToken: string; refreshToken: string; usuario: Usuario }>(),
);

// LIMPIAR ERROR
export const clearError = createAction('[Auth] Clear Error');