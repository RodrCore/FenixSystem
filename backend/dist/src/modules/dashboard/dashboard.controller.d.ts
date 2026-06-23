import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private svc;
    constructor(svc: DashboardService);
    getData(req: any): Promise<{
        kpis: {
            ventas_hoy: {
                valor: number;
                valor_ayer: number;
                variacion: number;
            };
            pedidos_activos: {
                valor: number;
                valor_ayer: number;
                diferencia: number;
            };
            tiempo_entrega: {
                horas: number;
                horas_ayer: number;
                variacion_min: number;
            };
            tasa_entrega: {
                valor: number;
                meta: number;
                diferencia: number;
                total_pedidos: number;
                entregados: number;
            };
        };
        ultimos_pedidos: {
            id: number;
            numero: string;
            cliente_id: number;
            cliente_nombre: string;
            monto: number;
            estado: import("@prisma/client").$Enums.EstadoPedido;
            fecha: Date;
        }[];
        ventas_7_dias: {
            fecha: string;
            total: number;
        }[];
        top_productos_hoy: {
            producto_id: number;
            nombre: string;
            codigo: string;
            total: number;
        }[];
        alertas: {
            lotes_por_vencer: {
                id: number;
                codigo_lote: string;
                producto: string;
                fecha_vencimiento: Date;
                cantidad: number;
                dias_restantes: number;
            }[];
            productos_sin_stock: number;
        };
        repartidores: {
            activos: number;
            total: number;
        };
        timestamp: string;
    }>;
}
