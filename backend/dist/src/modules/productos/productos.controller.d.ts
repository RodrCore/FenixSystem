import { ProductosService } from './productos.service';
export declare class ProductosController {
    private readonly productosService;
    constructor(productosService: ProductosService);
    getStats(): Promise<{
        total: number;
        activos: number;
        inactivos: number;
        sinStock: number;
        porVencer: number;
    }>;
    getCategorias(): Promise<{
        id: number;
        nombre: string;
    }[]>;
    getPresentaciones(): Promise<{
        id: number;
        nombre: string;
        siglas: string | null;
    }[]>;
    getProveedores(): Promise<{
        id: number;
        razon_social: string;
        nombre_comercial: string | null;
    }[]>;
    updateLoteEstado(loteId: number, estado: string): Promise<{
        id: number;
        created_at: Date;
        updated_at: Date;
        estado: import("@prisma/client").$Enums.EstadoLote;
        notas: string | null;
        producto_id: number;
        proveedor_id: number | null;
        codigo_lote: string;
        codigo_proveedor: string | null;
        fecha_ingreso: Date;
        fecha_fabricacion: Date | null;
        fecha_vencimiento: Date;
        presentacion_recibida_id: number;
        cantidad_recibida_presentacion: number;
        cantidad_unidades_inicial: number;
        cantidad_unidades_disponible: number;
        unidades_por_presentacion: number;
        costo_unitario: import("@prisma/client/runtime/library").Decimal | null;
        costo_total: import("@prisma/client/runtime/library").Decimal | null;
        ubicacion_almacen: string | null;
    }>;
    addLote(dto: any): Promise<{
        presentacion: {
            id: number;
            nombre: string;
        };
        proveedor: {
            id: number;
            razon_social: string;
        } | null;
    } & {
        id: number;
        created_at: Date;
        updated_at: Date;
        estado: import("@prisma/client").$Enums.EstadoLote;
        notas: string | null;
        producto_id: number;
        proveedor_id: number | null;
        codigo_lote: string;
        codigo_proveedor: string | null;
        fecha_ingreso: Date;
        fecha_fabricacion: Date | null;
        fecha_vencimiento: Date;
        presentacion_recibida_id: number;
        cantidad_recibida_presentacion: number;
        cantidad_unidades_inicial: number;
        cantidad_unidades_disponible: number;
        unidades_por_presentacion: number;
        costo_unitario: import("@prisma/client/runtime/library").Decimal | null;
        costo_total: import("@prisma/client/runtime/library").Decimal | null;
        ubicacion_almacen: string | null;
    }>;
    updatePresentacion(ppId: number, dto: any): Promise<{
        presentacion: {
            id: number;
            nombre: string;
            descripcion: string | null;
            created_at: Date;
            siglas: string | null;
            es_presentacion_venta: boolean;
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
    }>;
    findAll(query: any): Promise<{
        data: {
            stock_total: number;
            categoria: {
                id: number;
                nombre: string;
            } | null;
            lotes: {
                cantidad_unidades_disponible: number;
            }[];
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
        }[];
        total: number;
        page: number;
        limit: number;
        pages: number;
    }>;
    findOne(id: number): Promise<{
        categoria: {
            id: number;
            nombre: string;
            descripcion: string | null;
            activo: boolean;
            created_at: Date;
            categoria_padre_id: number | null;
            imagen_url: string | null;
            orden_visualizacion: number;
        } | null;
        lotes: ({
            presentacion: {
                id: number;
                nombre: string;
            };
            proveedor: {
                id: number;
                razon_social: string;
            } | null;
        } & {
            id: number;
            created_at: Date;
            updated_at: Date;
            estado: import("@prisma/client").$Enums.EstadoLote;
            notas: string | null;
            producto_id: number;
            proveedor_id: number | null;
            codigo_lote: string;
            codigo_proveedor: string | null;
            fecha_ingreso: Date;
            fecha_fabricacion: Date | null;
            fecha_vencimiento: Date;
            presentacion_recibida_id: number;
            cantidad_recibida_presentacion: number;
            cantidad_unidades_inicial: number;
            cantidad_unidades_disponible: number;
            unidades_por_presentacion: number;
            costo_unitario: import("@prisma/client/runtime/library").Decimal | null;
            costo_total: import("@prisma/client/runtime/library").Decimal | null;
            ubicacion_almacen: string | null;
        })[];
        presentaciones: ({
            presentacion: {
                id: number;
                nombre: string;
                descripcion: string | null;
                created_at: Date;
                siglas: string | null;
                es_presentacion_venta: boolean;
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
    } & {
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
    }>;
    create(dto: any): Promise<{
        categoria: {
            id: number;
            nombre: string;
        } | null;
    } & {
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
    }>;
    update(id: number, dto: any): Promise<{
        categoria: {
            id: number;
            nombre: string;
        } | null;
    } & {
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
    }>;
    toggle(id: number, activo: boolean): Promise<{
        id: number;
        activo: boolean;
    }>;
    addPresentacion(id: number, dto: any): Promise<{
        presentacion: {
            id: number;
            nombre: string;
            descripcion: string | null;
            created_at: Date;
            siglas: string | null;
            es_presentacion_venta: boolean;
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
    }>;
}
