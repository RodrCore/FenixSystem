import { PerfilService } from './perfil.service';
export declare class PerfilController {
    private perfilService;
    constructor(perfilService: PerfilService);
    getMi(req: any): Promise<{
        id: number;
        created_at: Date;
        email: string;
        numero_empleado: string | null;
        nombres: string;
        apellido_paterno: string;
        apellido_materno: string | null;
        telefono: string | null;
        avatar_url: string | null;
        fecha_contratacion: Date | null;
        rol: {
            id: number;
            nombre: string;
        };
    }>;
    actualizar(req: any, dto: any): Promise<{
        id: number;
        email: string;
        nombres: string;
        apellido_paterno: string;
        apellido_materno: string | null;
        telefono: string | null;
        avatar_url: string | null;
        rol: {
            id: number;
            nombre: string;
        };
    }>;
    cambiarPassword(req: any, dto: any): Promise<{
        mensaje: string;
    }>;
    subirAvatar(req: any, archivo: Express.Multer.File): Promise<{
        id: number;
        email: string;
        nombres: string;
        apellido_paterno: string;
        apellido_materno: string | null;
        telefono: string | null;
        avatar_url: string | null;
    }>;
    eliminarAvatar(req: any): Promise<{
        mensaje: string;
    }>;
    cerrarSesiones(req: any): Promise<{
        mensaje: string;
    }>;
}
