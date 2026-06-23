export declare class CreateProductoDto {
    nombre: string;
    descripcion_corta?: string;
    categoria_id?: number;
    marca?: string;
    precio_compra_promedio?: number;
    margen_ganancia_porcentaje?: number;
    stock_minimo?: number;
    stock_maximo?: number;
    dias_para_alerta_vencimiento?: number;
    codigo_interno?: string;
    codigo_barras_unidad_base?: string;
}
declare const UpdateProductoDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateProductoDto>>;
export declare class UpdateProductoDto extends UpdateProductoDto_base {
}
export {};
