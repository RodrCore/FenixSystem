export declare class CreateUserDto {
    email: string;
    ci?: string;
    nombres: string;
    apellido_paterno: string;
    apellido_materno?: string;
    password: string;
    rol_id: number;
    telefono?: string;
    numero_empleado?: string;
}
export declare class CreateAdminDto extends CreateUserDto {
}
