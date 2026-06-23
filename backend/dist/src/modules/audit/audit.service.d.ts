import { PrismaService } from '../../prisma/prisma.service';
export declare class AuditService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getAll(page?: number, limit?: number): Promise<{
        data: any[];
        total: number;
        page: number;
        limit: number;
        pages: number;
    }>;
    getById(id: string): Promise<any>;
    getByUser(userId: number, page?: number, limit?: number): Promise<{
        data: any[];
        total: number;
        page: number;
        limit: number;
        usuario: any;
    }>;
    getByAction(accion: string, page?: number, limit?: number): Promise<{
        data: any[];
        total: number;
        page: number;
        limit: number;
    }>;
    getByModule(modulo: string, page?: number, limit?: number): Promise<{
        data: any[];
        total: number;
        page: number;
        limit: number;
    }>;
    getByDateRange(desde: Date, hasta: Date, page?: number, limit?: number): Promise<{
        data: any[];
        total: number;
        page: number;
        limit: number;
    }>;
    getStatistics(): Promise<{
        totalLogs: number;
        logsHoy: number;
        logsEstaSemana: number;
        accionesTop5: Array<{
            accion: string;
            cantidad: number;
        }>;
        usuariosTop5: Array<{
            email: string;
            nombres: string;
            cantidad: number;
        }>;
        modulosTop5: Array<{
            modulo: string;
            cantidad: number;
        }>;
    }>;
    deleteOldLogs(daysOld?: number): Promise<{
        deletedCount: number;
    }>;
    exportLogsAsCSV(desde: Date, hasta: Date): Promise<string>;
}
