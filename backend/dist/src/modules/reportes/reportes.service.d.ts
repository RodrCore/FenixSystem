import { PrismaService } from '../../prisma/prisma.service';
export interface ReportePreventista {
    mes: string;
    anio: number;
    vendedor: {
        id: number;
        nombre: string;
    };
    resumen: {
        total_ventas: number;
        monto_facturado: number;
        monto_entregado: number;
        monto_cancelado: number;
        promedio_por_venta: number;
    };
    por_estado: Record<string, {
        cantidad: number;
        monto: number;
    }>;
    ventas: Array<{
        id: number;
        numero: string;
        fecha: string;
        cliente: string;
        estado: string;
        metodo_pago: string;
        total: number;
    }>;
}
export interface ReporteRepartidor {
    mes: string;
    anio: number;
    repartidor: {
        id: number;
        nombre: string;
    };
    resumen: {
        total_entregas: number;
        entregas_completas: number;
        entregas_parciales: number;
        devoluciones: number;
        monto_entregado: number;
    };
    por_dia: Array<{
        fecha: string;
        entregas: number;
        entregas_parciales: number;
        monto: number;
    }>;
}
export declare class ReportesService {
    private prisma;
    constructor(prisma: PrismaService);
    private rangoMes;
    getReportePreventista(usuarioId: number, mes: number, anio: number): Promise<ReportePreventista>;
    getReporteRepartidor(usuarioId: number, mes: number, anio: number): Promise<ReporteRepartidor>;
    generarPDFPreventista(usuarioId: number, mes: number, anio: number): Promise<Buffer>;
    generarPDFRepartidor(usuarioId: number, mes: number, anio: number): Promise<Buffer>;
    private dibujarHeader;
    private dibujarCardStat;
    private fmtDate;
    private fmtDateLong;
    private nombreMes;
}
