import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'La contraseña actual es requerida' })
  oldPassword!: string;

  @IsString()
  @IsNotEmpty({ message: 'La nueva contraseña es requerida' })
  @MinLength(8, { message: 'La nueva contraseña debe tener al menos 8 caracteres' })
  newPassword!: string;

  @IsString()
  @IsNotEmpty({ message: 'La confirmación es requerida' })
  @MinLength(8)
  confirmPassword!: string;
}