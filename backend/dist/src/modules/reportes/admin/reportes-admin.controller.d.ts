import type { Response } from 'express';
import { ReportesAdminService } from './reportes-admin.service';
import { ExcelExporterService } from './excel-exporter.service';
import { PdfExporterService } from './pdf-exporter.service';
import type { ReporteQuery } from './dto/reporte-query.dto';
export declare class ReportesAdminController {
    private svc;
    private excelExporter;
    private pdfExporter;
    constructor(svc: ReportesAdminService, excelExporter: ExcelExporterService, pdfExporter: PdfExporterService);
    getVentas(query: ReporteQuery): Promise<{
        periodo: {
            desde: string;
            hasta: string;
        };
        kpis: {
            total_ventas: number;
            cantidad_pedidos: number;
            ticket_promedio: number;
            variacion_total: number;
            variacion_cantidad: number;
            total_anterior: number;
            cantidad_anterior: number;
        };
        evolucion: {
            fecha: string;
            cantidad: number;
            total: number;
        }[];
        top_productos: never[];
        top_clientes: {
            cliente_id: number;
            nombre: string;
            compras: number;
            total: number;
        }[];
        por_metodo_pago: {
            metodo: import("@prisma/client").$Enums.MetodoPago;
            total: number;
            cantidad: number;
        }[];
    }>;
    getPedidos(query: ReporteQuery): Promise<{
        periodo: {
            desde: string;
            hasta: string;
        };
        kpis: {
            total_pedidos: number;
            variacion: number;
            promedio_dias_entrega: number;
            total_anterior: number;
        };
        por_estado: {
            estado: import("@prisma/client").$Enums.EstadoPedido;
            cantidad: number;
            total: number;
        }[];
        evolucion: {
            fecha: string;
            cantidad: number;
            total: number;
        }[];
        top_preventistas: {
            usuario_id: number | null;
            nombre: string;
            cantidad_pedidos: number;
            total_vendido: number;
        }[];
    }>;
    getReabastecimientos(query: ReporteQuery): Promise<{
        periodo: {
            desde: string;
            hasta: string;
        };
        kpis: {
            total_comprado: number;
            cantidad_ordenes: number;
            variacion: number;
        };
        por_estado: {
            estado: import("@prisma/client").$Enums.EstadoReabastecimiento;
            cantidad: number;
            total: number;
        }[];
        por_proveedor: {
            proveedor_id: number;
            nombre: string;
            cantidad_ordenes: number;
            total_comprado: number;
        }[];
        productos_mas_comprados: any[];
    }>;
    getInventario(query: ReporteQuery): Promise<{
        kpis: {
            total_productos: number;
            productos_stock_bajo: number;
            productos_sin_stock: number;
            lotes_por_vencer: number;
            lotes_vencidos: number;
            valor_inventario: number;
        };
        productos_stock_bajo: {
            id: number;
            nombre: string;
            codigo: string | null;
            stock_actual: any;
            stock_minimo: number;
            deficit: number;
        }[];
        lotes_por_vencer: {
            id: number;
            codigo_lote: string;
            producto: string;
            cantidad: number;
            fecha_vencimiento: Date;
            dias_restantes: number;
        }[];
        por_categoria: {
            categoria: string;
            cantidad_productos: number;
        }[];
    }>;
    getComercial(query: ReporteQuery): Promise<{
        periodo: {
            desde: string;
            hasta: string;
        };
        preventistas: {
            usuario_id: number | null;
            nombre: string;
            rol: string;
            cantidad_pedidos: number;
            total_vendido: number;
            ticket_promedio: number;
        }[];
        repartidores: {
            usuario_id: number | null;
            nombre: string;
            entregas: number;
            monto_entregado: number;
        }[];
        kpis: {
            total_preventistas_activos: number;
            total_repartidores_activos: number;
            mejor_vendedor: {
                usuario_id: number | null;
                nombre: string;
                rol: string;
                cantidad_pedidos: number;
                total_vendido: number;
                ticket_promedio: number;
            };
            mejor_repartidor: {
                usuario_id: number | null;
                nombre: string;
                entregas: number;
                monto_entregado: number;
            };
        };
    }>;
    getClientes(query: ReporteQuery): Promise<{
        periodo: {
            desde: string;
            hasta: string;
        };
        kpis: {
            total_clientes: number;
            nuevos_en_periodo: number;
            clientes_inactivos: number;
            clientes_activos: number;
        };
        top_clientes: {
            cliente_id: number;
            nombre: string;
            zona: string;
            compras: number;
            total: number;
        }[];
        por_zona: any[];
    }>;
    exportar(seccion: string, query: ReporteQuery & {
        formato: string;
    }, res: Response): Promise<void>;
}
