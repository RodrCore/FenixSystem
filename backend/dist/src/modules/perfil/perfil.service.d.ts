import { PrismaService } from '../../prisma/prisma.service';
export declare class PerfilService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getMi(usuarioId: number): Promise<{
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
    actualizarDatos(usuarioId: number, dto: {
        nombres?: string;
        apellido_paterno?: string;
        apellido_materno?: string;
        telefono?: string;
        email?: string;
    }): Promise<{
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
    cambiarPassword(usuarioId: number, dto: {
        actual: string;
        nueva: string;
    }): Promise<{
        mensaje: string;
    }>;
    actualizarAvatar(usuarioId: number, archivo: Express.Multer.File): Promise<{
        id: number;
        email: string;
        nombres: string;
        apellido_paterno: string;
        apellido_materno: string | null;
        telefono: string | null;
        avatar_url: string | null;
    }>;
    eliminarAvatar(usuarioId: number): Promise<{
        mensaje: string;
    }>;
    cerrarTodasLasSesiones(usuarioId: number): Promise<{
        mensaje: string;
    }>;
    private auditar;
}
