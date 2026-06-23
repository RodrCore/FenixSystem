import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  IsNumber,
} from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsOptional()
  @IsString()
  ci?: string;

  @IsString()
  @IsNotEmpty()
  nombres!: string;

  @IsString()
  @IsNotEmpty()
  apellido_paterno!: string;

  @IsString()
  @IsOptional()
  apellido_materno?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password!: string;

  @IsNumber()
  @IsNotEmpty({ message: 'El rol es requerido' })
  rol_id!: number;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsString()
  @IsOptional()
  numero_empleado?: string;
}

export class CreateAdminDto extends CreateUserDto {
  // ADMIN es específico, rol_id debe ser el de ADMIN
}
