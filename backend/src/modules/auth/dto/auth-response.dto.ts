import { IsNotEmpty, IsString } from 'class-validator';

// ===== RESPONSE DTOs (Sin validadores) =====

export class UsuarioResponseDto {
  id!: number;
  nombres!: string;
  apellido_paterno!: string;
  apellido_materno!: string;
  email!: string;
  numero_empleado!: string;
  telefono!: string;
  avatar_url!: string;
  rol!: {
    id: number;
    nombre: string;
    descripcion: string;
    permisos: Record<string, any>;
  };
}

export class AuthResponseDto {
  accessToken!: string;
  refreshToken!: string;
  usuario!: UsuarioResponseDto;
  expiresIn!: number;
}

// ===== INPUT DTO (Con validadores) =====

export class RefreshTokenDto {
  @IsNotEmpty({ message: 'El refresh token es requerido' })
  @IsString({ message: 'El refresh token debe ser una cadena de texto' })
  refreshToken!: string;
}