import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateUserDto, CreateAdminDto } from './dto/create-user.dto';
import { AuthResponseDto, UsuarioResponseDto } from './dto/auth-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { CurrentUser, Public, Roles, Permissions } from './decorators';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Registro público
   * POST /auth/register
   */
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }

  /**
   * Login público
   * POST /auth/login
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  /**
   * Obtener usuario actual
   * GET /auth/me
   * Requiere: Autenticado
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getCurrentUser(@CurrentUser() user: any): Promise<UsuarioResponseDto> {
    if (!user) {
      throw new BadRequestException('Usuario no encontrado');
    }
    return user;
  }

  /**
   * Refresh token
   * POST /auth/refresh
   */
  @Public()
  @Post('refresh')
  async refreshTokens(@Body('refreshToken') refreshToken: string, @Body('userId') userId: number): Promise<AuthResponseDto> {
    if (!refreshToken || !userId) {
      throw new BadRequestException('Refresh token y userId requeridos');
    }
    return this.authService.refreshTokens(userId, refreshToken);
  }

  /**
   * Cambiar contraseña
   * POST /auth/change-password
   * Requiere: Autenticado
   */
  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(
    @CurrentUser() user: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    return this.authService.changePassword(user.id, changePasswordDto);
  }

  /**
   * Logout
   * POST /auth/logout
   * Requiere: Autenticado
   * Nota: En frontend se limpia el token. En backend se puede limpiar refresh_token
   */
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@CurrentUser() user: any): Promise<{ message: string }> {
    // En este caso, solo es un logout del lado del frontend
    // Opcionalmente podrías invalidar el refresh token en BD
    return { message: 'Sesión cerrada correctamente' };
  }
}