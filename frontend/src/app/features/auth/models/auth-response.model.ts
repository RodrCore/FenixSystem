import { Usuario } from './user.model';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  usuario: Usuario;
  expiresIn: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  nombres: string;
  apellido_paterno: string;
  apellido_materno?: string;
  telefono?: string;
  numero_empleado?: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
  userId: number;
}