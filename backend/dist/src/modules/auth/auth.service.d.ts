import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { AuthResponseDto, UsuarioResponseDto } from './dto/auth-response.dto';
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    private readonly configService;
    private readonly logger;
    private readonly JWT_EXPIRATION;
    private readonly REFRESH_TOKEN_EXPIRATION;
    constructor(prisma: PrismaService, jwtService: JwtService, configService: ConfigService);
    register(registerDto: RegisterDto): Promise<AuthResponseDto>;
    login(loginDto: LoginDto): Promise<AuthResponseDto>;
    validateUser(email: string, password: string): Promise<{
        rol: {
            nombre: string;
            permisos: import("@prisma/client/runtime/library").JsonValue;
        };
        id: number;
        created_at: Date;
        updated_at: Date;
        email: string;
        numero_empleado: string | null;
        ci: string | null;
        rol_id: number;
        nombres: string;
        apellido_paterno: string;
        apellido_materno: string | null;
        telefono: string | null;
        avatar_url: string | null;
        fecha_contratacion: Date | null;
        salario_base: import("@prisma/client/runtime/library").Decimal | null;
        comision_porcentaje: import("@prisma/client/runtime/library").Decimal | null;
        estado: boolean;
        ultimo_acceso: Date | null;
        refresh_token: string | null;
        reset_token: string | null;
        reset_token_expira: Date | null;
        ultima_ip: string | null;
        intentos_fallidos_login: number;
        bloqueado_hasta: Date | null;
        password_temporal: boolean;
        requiere_cambio_password: boolean;
        deleted_at: Date | null;
        deleted_by: number | null;
        motivo_eliminacion: string | null;
    } | null>;
    generateTokens(usuario: any): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    }>;
    refreshTokens(usuarioId: number, refreshToken: string): Promise<AuthResponseDto>;
    changePassword(usuarioId: number, changePasswordDto: ChangePasswordDto): Promise<{
        message: string;
    }>;
    createUser(createUserDto: CreateUserDto): Promise<UsuarioResponseDto>;
    private mapToUsuarioResponse;
    private logAuditoria;
}
