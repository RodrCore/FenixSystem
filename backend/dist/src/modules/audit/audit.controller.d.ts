import type { Response as ExpressResponse } from 'express';
import { AuditService } from './audit.service';
export declare class AuditController {
    private auditService;
    constructor(auditService: AuditService);
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
    getByDateRange(desde: string, hasta: string, page?: number, limit?: number): Promise<{
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
    exportCSV(desde: string, hasta: string, res: ExpressResponse): Promise<void>;
    deleteOldLogs(days?: number): Promise<{
        deletedCount: number;
    }>;
}
