import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { AuthResponseDto, UsuarioResponseDto } from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly JWT_EXPIRATION = '15m';
  private readonly REFRESH_TOKEN_EXPIRATION = '7d';

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // =============================================
  // REGISTRO
  // =============================================

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    try {
      const {
        email,
        password,
        nombres,
        apellido_paterno,
        apellido_materno,
        telefono,
        numero_empleado,
      } = registerDto;

      // Verificar si el usuario ya existe
      const usuarioExistente = await this.prisma.usuario.findUnique({
        where: { email },
      });

      if (usuarioExistente) {
        throw new ConflictException('El email ya está registrado');
      }

      // Hash de la contraseña
      const passwordHash = await bcrypt.hash(password, 10);

      // Obtener rol por defecto (USER)
      const rolDefault = await this.prisma.role.findUnique({
        where: { nombre: 'PREVENTISTA' }, // O el rol que quieras por defecto
      });

      if (!rolDefault) {
        throw new BadRequestException('El rol por defecto no existe');
      }

      // Crear usuario
      const usuario = await this.prisma.usuario.create({
        data: {
          email,
          password_hash: passwordHash,
          nombres,
          apellido_paterno,
          apellido_materno: apellido_materno || null,
          telefono: telefono || null,
          numero_empleado: numero_empleado || null,
          rol_id: rolDefault.id,
          estado: true,
        },
        include: {
          rol: {
            select: {
              id: true,
              nombre: true,
              descripcion: true,
              permisos: true,
            },
          },
        },
      });

      // Generar tokens
      const tokens = await this.generateTokens(usuario);

      this.logger.log(`Usuario registrado: ${email}`);

      return {
        ...tokens,
        usuario: this.mapToUsuarioResponse(usuario),
      };
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Error en registro: ${error.message}`);
      } else {
        this.logger.error(`Error en registro: Error desconocido`);
      }
      throw error;
    }
  }

  // =============================================
  // LOGIN
  // =============================================

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    try {
      const { email, password } = loginDto;

      // Buscar usuario
      const usuario = await this.prisma.usuario.findUnique({
        where: { email },
        include: {
          rol: {
            select: {
              id: true,
              nombre: true,
              descripcion: true,
              permisos: true,
            },
          },
        },
      });

      if (!usuario) {
        throw new UnauthorizedException('Email o contraseña incorrectos');
      }

      // Verificar estado del usuario
      if (!usuario.estado) {
        throw new UnauthorizedException('El usuario está inactivo');
      }

      // Validar contraseña
      const passwordValida = await bcrypt.compare(
        password,
        usuario.password_hash,
      );

      if (!passwordValida) {
        throw new UnauthorizedException('Email o contraseña incorrectos');
      }

      // Actualizar último acceso
      await this.prisma.usuario.update({
        where: { id: usuario.id },
        data: { ultimo_acceso: new Date() },
      });

      // Generar tokens
      const tokens = await this.generateTokens(usuario);

      this.logger.log(`Usuario autenticado: ${email}`);

      // Registrar en auditoría
      await this.logAuditoria(usuario.id, 'LOGIN', 'AUTH', null, null, {
        action: 'login_exitoso',
      });

      return {
        ...tokens,
        usuario: this.mapToUsuarioResponse(usuario),
      };
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Error en registro: ${error.message}`);
      } else {
        this.logger.error(`Error en registro: Error desconocido`);
      }
      throw error;
    }
  }

  // =============================================
  // VALIDAR USUARIO (Para Strategy Local)
  // =============================================

  async validateUser(email: string, password: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { email },
      include: {
        rol: {
          select: {
            nombre: true,
            permisos: true,
          },
        },
      },
    });

    if (usuario && (await bcrypt.compare(password, usuario.password_hash))) {
      const { password_hash, ...result } = usuario;
      return result;
    }

    return null;
  }

  // =============================================
  // GENERAR TOKENS
  // =============================================

  async generateTokens(usuario: any) {
    const payload = {
      sub: usuario.id,
      email: usuario.email,
      nombres: usuario.nombres,
      rol: usuario.rol.nombre,
      permisos: usuario.rol.permisos,
    };

    // Access Token (15 minutos)
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.JWT_EXPIRATION,
    });

    // Refresh Token (7 días)
    const refreshToken = this.jwtService.sign(payload, {
      secret:
        this.configService.get('JWT_REFRESH_SECRET') ||
        this.configService.get('JWT_SECRET'),
      expiresIn: this.REFRESH_TOKEN_EXPIRATION,
    });

    // Guardar refresh token en BD
    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: { refresh_token: refreshToken },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutos en segundos
    };
  }

  // =============================================
  // REFRESH TOKEN
  // =============================================

  async refreshTokens(
    usuarioId: number,
    refreshToken: string,
  ): Promise<AuthResponseDto> {
    try {
      // Obtener usuario
      const usuario = await this.prisma.usuario.findUnique({
        where: { id: usuarioId },
        include: {
          rol: {
            select: {
              id: true,
              nombre: true,
              descripcion: true,
              permisos: true,
            },
          },
        },
      });

      if (!usuario || usuario.refresh_token !== refreshToken) {
        throw new UnauthorizedException('Refresh token inválido');
      }

      // Generar nuevos tokens
      const tokens = await this.generateTokens(usuario);

      return {
        ...tokens,
        usuario: this.mapToUsuarioResponse(usuario),
      };
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Error en registro: ${error.message}`);
      } else {
        this.logger.error(`Error en registro: Error desconocido`);
      }
      throw error;
    }
  }

  // =============================================
  // CAMBIAR CONTRASEÑA
  // =============================================

  async changePassword(
    usuarioId: number,
    changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    try {
      const { oldPassword, newPassword, confirmPassword } = changePasswordDto;

      // Validar que las nuevas contraseñas coincidan
      if (newPassword !== confirmPassword) {
        throw new BadRequestException('Las contraseñas no coinciden');
      }

      // Obtener usuario
      const usuario = await this.prisma.usuario.findUnique({
        where: { id: usuarioId },
      });

      if (!usuario) {
        throw new UnauthorizedException('Usuario no encontrado');
      }

      // Validar contraseña actual
      const passwordValida = await bcrypt.compare(
        oldPassword,
        usuario.password_hash,
      );

      if (!passwordValida) {
        throw new BadRequestException('La contraseña actual es incorrecta');
      }

      // Hash de la nueva contraseña
      const newPasswordHash = await bcrypt.hash(newPassword, 10);

      // Actualizar contraseña
      await this.prisma.usuario.update({
        where: { id: usuarioId },
        data: { password_hash: newPasswordHash },
      });

      this.logger.log(`Contraseña cambiada: usuario ${usuarioId}`);

      // Registrar en auditoría
      await this.logAuditoria(
        usuarioId,
        'CHANGE_PASSWORD',
        'AUTH',
        null,
        null,
        {
          action: 'cambio_contraseña',
        },
      );

      return { message: 'Contraseña actualizada correctamente' };
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Error en registro: ${error.message}`);
      } else {
        this.logger.error(`Error en registro: Error desconocido`);
      }
      throw error;
    }
  }

  // =============================================
  // CREAR USUARIO (Por ADMIN/SUPER_ADMIN)
  // =============================================

  async createUser(createUserDto: CreateUserDto): Promise<UsuarioResponseDto> {
    try {
      const {
        email,
        password,
        nombres,
        apellido_paterno,
        apellido_materno,
        rol_id,
        telefono,
        numero_empleado,
      } = createUserDto;

      // Verificar si el usuario ya existe
      const usuarioExistente = await this.prisma.usuario.findUnique({
        where: { email },
      });

      if (usuarioExistente) {
        throw new ConflictException('El email ya está registrado');
      }

      // Verificar que el rol exista
      const rol = await this.prisma.role.findUnique({
        where: { id: rol_id },
      });

      if (!rol) {
        throw new BadRequestException('El rol especificado no existe');
      }

      // Hash de la contraseña
      const passwordHash = await bcrypt.hash(password, 10);

      // Crear usuario
      const usuario = await this.prisma.usuario.create({
        data: {
          email,
          password_hash: passwordHash,
          nombres,
          apellido_paterno,
          apellido_materno: apellido_materno || null,
          telefono: telefono || null,
          numero_empleado: numero_empleado || null,
          rol_id,
          estado: true,
        },
        include: {
          rol: {
            select: {
              id: true,
              nombre: true,
              descripcion: true,
              permisos: true,
            },
          },
        },
      });

      this.logger.log(`Usuario creado: ${email} con rol ${rol.nombre}`);

      return this.mapToUsuarioResponse(usuario);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Error en registro: ${error.message}`);
      } else {
        this.logger.error(`Error en registro: Error desconocido`);
      }
      throw error;
    }
  }

  // =============================================
  // UTILIDADES
  // =============================================

  private mapToUsuarioResponse(usuario: any): UsuarioResponseDto {
    return {
      id: usuario.id,
      nombres: usuario.nombres,
      apellido_paterno: usuario.apellido_paterno,
      apellido_materno: usuario.apellido_materno,
      email: usuario.email,
      numero_empleado: usuario.numero_empleado,
      telefono: usuario.telefono,
      avatar_url: usuario.avatar_url,
      rol: usuario.rol,
    };
  }

  private async logAuditoria(
    usuarioId: number,
    accion: string,
    modulo: string,
    tablaAfectada: string | null,
    registroId: string | null,
    valorNuevo: any,
  ) {
    try {
      await this.prisma.auditoriaLog.create({
        data: {
          usuario_id: usuarioId,
          accion,
          modulo,
          tabla_afectada: tablaAfectada,
          registro_id: registroId,
          valor_nuevo: valorNuevo,
          fecha_hora: new Date(),
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Error en registro: ${error.message}`);
      } else {
        this.logger.error(`Error en registro: Error desconocido`);
      }
      throw error;
    }
  }
}
