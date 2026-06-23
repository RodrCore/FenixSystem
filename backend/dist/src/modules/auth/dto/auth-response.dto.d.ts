export declare class UsuarioResponseDto {
    id: number;
    nombres: string;
    apellido_paterno: string;
    apellido_materno: string;
    email: string;
    numero_empleado: string;
    telefono: string;
    avatar_url: string;
    rol: {
        id: number;
        nombre: string;
        descripcion: string;
        permisos: Record<string, any>;
    };
}
export declare class AuthResponseDto {
    accessToken: string;
    refreshToken: string;
    usuario: UsuarioResponseDto;
    expiresIn: number;
}
export declare class RefreshTokenDto {
    refreshToken: string;
}
