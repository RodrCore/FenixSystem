export declare class CreateLoteDto {
    producto_id: number;
    proveedor_id?: number;
    codigo_lote: string;
    fecha_vencimiento: string;
    presentacion_recibida_id: number;
    cantidad_recibida_presentacion: number;
    unidades_por_presentacion: number;
    costo_unitario?: number;
    ubicacion_almacen?: string;
    notas?: string;
}
