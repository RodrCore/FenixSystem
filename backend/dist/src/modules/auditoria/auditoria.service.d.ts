import { PrismaService } from '../../prisma/prisma.service';
export declare class AuditoriaService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(query?: any): Promise<{
        data: {
            id: any;
            usuario_id: any;
            usuario_nombre: string;
            usuario_rol: any;
            accion: any;
            modulo: any;
            tabla_afectada: any;
            registro_id: any;
            ip_origen: any;
            fecha_hora: any;
        }[];
        total: number;
        page: number;
        pages: number;
        limit: number;
    }>;
    findById(id: string): Promise<{
        id: any;
        sesion_id: any;
        usuario: {
            id: any;
            nombre: string;
            email: any;
            rol: any;
        } | null;
        accion: any;
        modulo: any;
        tabla_afectada: any;
        registro_id: any;
        valor_anterior: any;
        valor_nuevo: any;
        ip_origen: any;
        user_agent: any;
        dispositivo: any;
        navegador: any;
        fecha_hora: any;
    }>;
    getStats(): Promise<{
        total_periodo: number;
        acciones_hoy: number;
        usuarios_activos_hoy: number;
        modulo_mas_activo: string;
        modulo_mas_activo_count: number;
    }>;
    getFiltrosOpciones(): Promise<{
        modulos: (string | null)[];
        acciones: string[];
        usuarios: {
            id: number;
            nombre: string;
            rol: string;
        }[];
    }>;
    exportExcel(query?: any): Promise<Buffer>;
    private buildWhere;
    private mapToResponse;
    private mapToResponseDetailed;
}
