import type { Response } from 'express';
import { ReabastecimientoService } from './reabastecimiento.service';
import { ReabastecimientoPdfService } from './reabastecimiento-pdf.service';
export declare class ReabastecimientoController {
    private svc;
    private pdfSvc;
    constructor(svc: ReabastecimientoService, pdfSvc: ReabastecimientoPdfService);
    getStats(): Promise<{
        total: number;
        pendientes: number;
        recibidas_hoy: number;
        total_mes: number;
    }>;
    getSugerencias(): Promise<{
        id: number;
        nombre: string;
        codigo_interno: string | null;
        stock_actual: number;
        stock_minimo: number;
        stock_maximo: number;
        cantidad_sugerida: number;
        presentaciones: ({
            presentacion: {
                id: number;
                nombre: string;
                siglas: string | null;
            };
        } & {
            id: number;
            activo: boolean;
            created_at: Date;
            codigo_barras_presentacion: string | null;
            producto_id: number;
            presentacion_id: number;
            unidades_equivalentes: import("@prisma/client/runtime/library").Decimal;
            precio_venta: import("@prisma/client/runtime/library").Decimal;
            precio_mayoreo: import("@prisma/client/runtime/library").Decimal | null;
            cantidad_minima_mayoreo: number;
        })[];
    }[]>;
    findAll(query: any): Promise<{
        data: {
            subtotal: number;
            total: number;
            cantidad_items: any;
            _count: {
                detalles: number;
            };
            proveedor: {
                id: number;
                razon_social: string;
                nombre_comercial: string | null;
            };
            solicitante: {
                id: number;
                nombres: string;
                apellido_paterno: string;
            };
            id: number;
            created_at: Date;
            updated_at: Date;
            estado: import("@prisma/client").$Enums.EstadoReabastecimiento;
            deleted_at: Date | null;
            deleted_by: number | null;
            motivo_eliminacion: string | null;
            notas: string | null;
            proveedor_id: number;
            numero_orden: string;
            fecha_solicitud: Date;
            fecha_recepcion: Date | null;
            fecha_esperada: Date | null;
            solicitado_por_id: number;
            recibido_por_id: number | null;
        }[];
        total: number;
        page: number;
        pages: number;
        limit: number;
    }>;
    findOne(id: number): Promise<{
        subtotal: number;
        total: number;
        detalles: {
            precio_unitario_compra: number;
            subtotal: number;
            producto_presentacion: {
                presentacion: {
                    id: number;
                    nombre: string;
                    siglas: string | null;
                };
                producto: {
                    id: number;
                    nombre: string;
                    codigo_interno: string | null;
                    stock_minimo: number;
                };
            } & {
                id: number;
                activo: boolean;
                created_at: Date;
                codigo_barras_presentacion: string | null;
                producto_id: number;
                presentacion_id: number;
                unidades_equivalentes: import("@prisma/client/runtime/library").Decimal;
                precio_venta: import("@prisma/client/runtime/library").Decimal;
                precio_mayoreo: import("@prisma/client/runtime/library").Decimal | null;
                cantidad_minima_mayoreo: number;
            };
            id: number;
            orden_id: number;
            producto_presentacion_id: number;
            cantidad_solicitada: number;
            cantidad_recibida: number;
        }[];
        eliminador: {
            id: number;
            nombres: string;
            apellido_paterno: string;
        } | null;
        proveedor: {
            id: number;
            activo: boolean;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            deleted_by: number | null;
            motivo_eliminacion: string | null;
            nit_rfc: string | null;
            razon_social: string;
            nombre_comercial: string | null;
            contacto_nombres: string | null;
            contacto_telefono: string | null;
            contacto_email: string | null;
            direccion_completa: string | null;
            latitud: import("@prisma/client/runtime/library").Decimal | null;
            longitud: import("@prisma/client/runtime/library").Decimal | null;
            dias_entrega: string | null;
            condiciones_pago: string | null;
            notas: string | null;
        };
        solicitante: {
            id: number;
            email: string;
            nombres: string;
            apellido_paterno: string;
            apellido_materno: string | null;
        };
        receptor: {
            id: number;
            nombres: string;
            apellido_paterno: string;
            apellido_materno: string | null;
        } | null;
        id: number;
        created_at: Date;
        updated_at: Date;
        estado: import("@prisma/client").$Enums.EstadoReabastecimiento;
        deleted_at: Date | null;
        deleted_by: number | null;
        motivo_eliminacion: string | null;
        notas: string | null;
        proveedor_id: number;
        numero_orden: string;
        fecha_solicitud: Date;
        fecha_recepcion: Date | null;
        fecha_esperada: Date | null;
        solicitado_por_id: number;
        recibido_por_id: number | null;
    }>;
    descargarPdf(id: number, res: Response): Promise<void>;
    create(dto: any, req: any): Promise<{
        proveedor: {
            id: number;
            razon_social: string;
        };
        detalles: ({
            producto_presentacion: {
                presentacion: {
                    id: number;
                    nombre: string;
                    descripcion: string | null;
                    created_at: Date;
                    siglas: string | null;
                    es_presentacion_venta: boolean;
                };
                producto: {
                    id: number;
                    nombre: string;
                    activo: boolean;
                    created_at: Date;
                    updated_at: Date;
                    imagen_url: string | null;
                    codigo_barras_unidad_base: string | null;
                    codigo_interno: string | null;
                    descripcion_corta: string | null;
                    descripcion_larga: string | null;
                    categoria_id: number | null;
                    marca: string | null;
                    unidad_medida_base: string;
                    peso_gramos: import("@prisma/client/runtime/library").Decimal | null;
                    volumen_mililitros: import("@prisma/client/runtime/library").Decimal | null;
                    precio_compra_promedio: import("@prisma/client/runtime/library").Decimal | null;
                    margen_ganancia_porcentaje: import("@prisma/client/runtime/library").Decimal | null;
                    iva_porcentaje: import("@prisma/client/runtime/library").Decimal | null;
                    ieps_porcentaje: import("@prisma/client/runtime/library").Decimal | null;
                    stock_minimo: number;
                    stock_maximo: number;
                    dias_para_alerta_vencimiento: number;
                };
            } & {
                id: number;
                activo: boolean;
                created_at: Date;
                codigo_barras_presentacion: string | null;
                producto_id: number;
                presentacion_id: number;
                unidades_equivalentes: import("@prisma/client/runtime/library").Decimal;
                precio_venta: import("@prisma/client/runtime/library").Decimal;
                precio_mayoreo: import("@prisma/client/runtime/library").Decimal | null;
                cantidad_minima_mayoreo: number;
            };
        } & {
            id: number;
            subtotal: import("@prisma/client/runtime/library").Decimal;
            orden_id: number;
            producto_presentacion_id: number;
            cantidad_solicitada: number;
            cantidad_recibida: number;
            precio_unitario_compra: import("@prisma/client/runtime/library").Decimal;
        })[];
    } & {
        id: number;
        created_at: Date;
        updated_at: Date;
        estado: import("@prisma/client").$Enums.EstadoReabastecimiento;
        deleted_at: Date | null;
        deleted_by: number | null;
        motivo_eliminacion: string | null;
        notas: string | null;
        proveedor_id: number;
        total: import("@prisma/client/runtime/library").Decimal;
        subtotal: import("@prisma/client/runtime/library").Decimal;
        numero_orden: string;
        fecha_solicitud: Date;
        fecha_recepcion: Date | null;
        fecha_esperada: Date | null;
        solicitado_por_id: number;
        recibido_por_id: number | null;
    }>;
    recibir(id: number, detalles: any[], req: any): Promise<{
        proveedor: {
            id: number;
            activo: boolean;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            deleted_by: number | null;
            motivo_eliminacion: string | null;
            nit_rfc: string | null;
            razon_social: string;
            nombre_comercial: string | null;
            contacto_nombres: string | null;
            contacto_telefono: string | null;
            contacto_email: string | null;
            direccion_completa: string | null;
            latitud: import("@prisma/client/runtime/library").Decimal | null;
            longitud: import("@prisma/client/runtime/library").Decimal | null;
            dias_entrega: string | null;
            condiciones_pago: string | null;
            notas: string | null;
        };
        detalles: ({
            producto_presentacion: {
                presentacion: {
                    id: number;
                    nombre: string;
                    descripcion: string | null;
                    created_at: Date;
                    siglas: string | null;
                    es_presentacion_venta: boolean;
                };
                producto: {
                    id: number;
                    nombre: string;
                    activo: boolean;
                    created_at: Date;
                    updated_at: Date;
                    imagen_url: string | null;
                    codigo_barras_unidad_base: string | null;
                    codigo_interno: string | null;
                    descripcion_corta: string | null;
                    descripcion_larga: string | null;
                    categoria_id: number | null;
                    marca: string | null;
                    unidad_medida_base: string;
                    peso_gramos: import("@prisma/client/runtime/library").Decimal | null;
                    volumen_mililitros: import("@prisma/client/runtime/library").Decimal | null;
                    precio_compra_promedio: import("@prisma/client/runtime/library").Decimal | null;
                    margen_ganancia_porcentaje: import("@prisma/client/runtime/library").Decimal | null;
                    iva_porcentaje: import("@prisma/client/runtime/library").Decimal | null;
                    ieps_porcentaje: import("@prisma/client/runtime/library").Decimal | null;
                    stock_minimo: number;
                    stock_maximo: number;
                    dias_para_alerta_vencimiento: number;
                };
            } & {
                id: number;
                activo: boolean;
                created_at: Date;
                codigo_barras_presentacion: string | null;
                producto_id: number;
                presentacion_id: number;
                unidades_equivalentes: import("@prisma/client/runtime/library").Decimal;
                precio_venta: import("@prisma/client/runtime/library").Decimal;
                precio_mayoreo: import("@prisma/client/runtime/library").Decimal | null;
                cantidad_minima_mayoreo: number;
            };
        } & {
            id: number;
            subtotal: import("@prisma/client/runtime/library").Decimal;
            orden_id: number;
            producto_presentacion_id: number;
            cantidad_solicitada: number;
            cantidad_recibida: number;
            precio_unitario_compra: import("@prisma/client/runtime/library").Decimal;
        })[];
        solicitante: {
            nombres: string;
            apellido_paterno: string;
        };
        receptor: {
            nombres: string;
            apellido_paterno: string;
        } | null;
    } & {
        id: number;
        created_at: Date;
        updated_at: Date;
        estado: import("@prisma/client").$Enums.EstadoReabastecimiento;
        deleted_at: Date | null;
        deleted_by: number | null;
        motivo_eliminacion: string | null;
        notas: string | null;
        proveedor_id: number;
        total: import("@prisma/client/runtime/library").Decimal;
        subtotal: import("@prisma/client/runtime/library").Decimal;
        numero_orden: string;
        fecha_solicitud: Date;
        fecha_recepcion: Date | null;
        fecha_esperada: Date | null;
        solicitado_por_id: number;
        recibido_por_id: number | null;
    }>;
    cancelar(id: number, motivo: string, req: any): Promise<{
        id: number;
        created_at: Date;
        updated_at: Date;
        estado: import("@prisma/client").$Enums.EstadoReabastecimiento;
        deleted_at: Date | null;
        deleted_by: number | null;
        motivo_eliminacion: string | null;
        notas: string | null;
        proveedor_id: number;
        total: import("@prisma/client/runtime/library").Decimal;
        subtotal: import("@prisma/client/runtime/library").Decimal;
        numero_orden: string;
        fecha_solicitud: Date;
        fecha_recepcion: Date | null;
        fecha_esperada: Date | null;
        solicitado_por_id: number;
        recibido_por_id: number | null;
    }>;
    softDelete(id: number, motivo: string, req: any): Promise<{
        id: number;
        created_at: Date;
        updated_at: Date;
        estado: import("@prisma/client").$Enums.EstadoReabastecimiento;
        deleted_at: Date | null;
        deleted_by: number | null;
        motivo_eliminacion: string | null;
        notas: string | null;
        proveedor_id: number;
        total: import("@prisma/client/runtime/library").Decimal;
        subtotal: import("@prisma/client/runtime/library").Decimal;
        numero_orden: string;
        fecha_solicitud: Date;
        fecha_recepcion: Date | null;
        fecha_esperada: Date | null;
        solicitado_por_id: number;
        recibido_por_id: number | null;
    }>;
}
