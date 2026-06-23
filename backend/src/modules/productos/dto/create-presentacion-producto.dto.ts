import { IsNumber, IsPositive, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePresentacionProductoDto {
  @IsNumber() @Type(() => Number)
  presentacion_id!: number;
 
  @IsNumber() @IsPositive() @Type(() => Number)
  unidades_equivalentes!: number;
 
  @IsNumber() @IsPositive() @Type(() => Number)
  precio_venta!: number;
 
  @IsOptional() @IsNumber() @IsPositive() @Type(() => Number)
  precio_mayoreo?: number;
 
  @IsOptional() @IsNumber() @Min(1) @Type(() => Number)
  cantidad_minima_mayoreo?: number;
}
