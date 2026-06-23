import { IsOptional, IsString, IsNumber, IsBoolean, Min } from 'class-validator';
import { Type } from 'class-transformer';
 
export class QueryProductoDto {
  @IsOptional() @IsString()   buscar?: string;
  @IsOptional() @IsNumber() @Type(() => Number) categoria_id?: number;
  @IsOptional() @IsString()   marca?: string;
  @IsOptional() @IsBoolean() @Type(() => Boolean) activo?: boolean;
  @IsOptional() @IsNumber() @Min(1) @Type(() => Number) page?: number = 1;
  @IsOptional() @IsNumber() @Min(1) @Type(() => Number) limit?: number = 20;
  @IsOptional() @IsString()   orderBy?: string = 'nombre';
  @IsOptional() @IsString()   order?: 'asc' | 'desc' = 'asc';
}
