export interface LoginRequest {
  email:    string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  usuario: Usuario;
}

export interface Usuario {
  id:                number;
  nombres:           string;
  apellido_paterno:  string;
  email:             string;
  rol:               Rol;
  activo:            boolean;
  avatar_url:        string;
}

export type Rol =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'GERENTE'
  | 'PREVENTISTA'
  | 'ALMACEN'
  | 'REPARTIDOR';