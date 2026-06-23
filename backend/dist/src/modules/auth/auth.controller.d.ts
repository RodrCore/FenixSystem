import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AuthResponseDto, UsuarioResponseDto } from './dto/auth-response.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    register(registerDto: RegisterDto): Promise<AuthResponseDto>;
    login(loginDto: LoginDto): Promise<AuthResponseDto>;
    getCurrentUser(user: any): Promise<UsuarioResponseDto>;
    refreshTokens(refreshToken: string, userId: number): Promise<AuthResponseDto>;
    changePassword(user: any, changePasswordDto: ChangePasswordDto): Promise<{
        message: string;
    }>;
    logout(user: any): Promise<{
        message: string;
    }>;
}
