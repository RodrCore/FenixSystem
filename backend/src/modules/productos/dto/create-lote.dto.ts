import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsNumber, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateLoteDto {
  @IsNumber() @Type(() => Number)
  producto_id!: number;
 
  @IsOptional() @IsNumber() @Type(() => Number)
  proveedor_id?: number;
 
  @IsString() @IsNotEmpty()
  codigo_lote!: string;
 
  @IsString() @IsNotEmpty()
  fecha_vencimiento!: string;
 
  @IsNumber() @Type(() => Number)
  presentacion_recibida_id!: number;
 
  @IsNumber() @IsPositive() @Type(() => Number)
  cantidad_recibida_presentacion!: number;
 
  @IsNumber() @IsPositive() @Type(() => Number)
  unidades_por_presentacion!: number;
 
  @IsOptional() @IsNumber() @IsPositive() @Type(() => Number)
  costo_unitario?: number;
 
  @IsOptional() @IsString()
  ubicacion_almacen?: string;
 
  @IsOptional() @IsString()
  notas?: string;
}
