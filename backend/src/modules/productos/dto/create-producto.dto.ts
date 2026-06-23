import { IsString, IsNotEmpty, IsOptional, IsNumber, IsPositive, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';
 
export class CreateProductoDto {
  @IsString() @IsNotEmpty()
  nombre!: string;
 
  @IsOptional() @IsString()
  descripcion_corta?: string;
 
  @IsOptional() @IsNumber() @Type(() => Number)
  categoria_id?: number;
 
  @IsOptional() @IsString()
  marca?: string;
 
  @IsOptional() @IsNumber() @IsPositive() @Type(() => Number)
  precio_compra_promedio?: number;
 
  @IsOptional() @IsNumber() @Min(0) @Max(100) @Type(() => Number)
  margen_ganancia_porcentaje?: number;
 
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number)
  stock_minimo?: number;
 
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number)
  stock_maximo?: number;
 
  @IsOptional() @IsNumber() @Min(1) @Type(() => Number)
  dias_para_alerta_vencimiento?: number;
 
  @IsOptional() @IsString()
  codigo_interno?: string;
 
  @IsOptional() @IsString()
  codigo_barras_unidad_base?: string;
}
 
export class UpdateProductoDto extends PartialType(CreateProductoDto) {}