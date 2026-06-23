// ═══════════════════════════════════════════════════════════════
// backend/src/common/interceptors/auditoria.interceptor.ts
//
// Interceptor global que registra automáticamente en AuditoriaLog:
// - Usuario que hizo la acción
// - Método HTTP (POST/PATCH/DELETE/PUT)
// - Ruta accedida
// - Datos enviados (body)
// - Resultado (respuesta)
// - IP, user-agent, timestamp
//
// Solo registra mutaciones (no GETs).
// ═══════════════════════════════════════════════════════════════

import {
  Injectable, NestInterceptor, ExecutionContext, CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

interface RequestWithUser extends Request {
  user?: { id: number; rol?: string; email?: string };
}

@Injectable()
export class AuditoriaInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditoriaInterceptor.name);

  // Métodos HTTP que se auditan (las consultas GET no se loguean)
  private readonly metodosAuditables = ['POST', 'PATCH', 'PUT', 'DELETE'];

  // Rutas que se excluyen (login, refresh-token, etc.)
  private readonly rutasExcluidas = [
    '/api/auth/login',
    '/api/auth/refresh',
    '/api/auth/logout',
  ];

  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest<RequestWithUser>();
    const { method, originalUrl, body, user } = req;

    // Filtrar: solo mutaciones y solo con usuario autenticado
    if (!this.metodosAuditables.includes(method)) {
      return next.handle();
    }
    if (!user?.id) {
      return next.handle();
    }
    if (this.rutasExcluidas.some(r => originalUrl.startsWith(r))) {
      return next.handle();
    }

    const inicio = Date.now();

    return next.handle().pipe(
      tap(async (response) => {
        await this.registrarAuditoria({
          usuarioId:   user.id,
          metodo:      method,
          url:         originalUrl,
          body:        this.sanitizarBody(body),
          response:    this.sanitizarResponse(response),
          ip:          this.extraerIp(req),
          userAgent:   req.headers['user-agent'] || null,
          durationMs:  Date.now() - inicio,
          exitoso:     true,
        });
      }),
      catchError(async (error) => {
        await this.registrarAuditoria({
          usuarioId:   user.id,
          metodo:      method,
          url:         originalUrl,
          body:        this.sanitizarBody(body),
          response:    { error: error.message },
          ip:          this.extraerIp(req),
          userAgent:   req.headers['user-agent'] || null,
          durationMs:  Date.now() - inicio,
          exitoso:     false,
        });
        return throwError(() => error);
      }) as any,
    );
  }

  private async registrarAuditoria(data: {
    usuarioId:   number;
    metodo:      string;
    url:         string;
    body:        any;
    response:    any;
    ip:          string | null;
    userAgent:   string | null;
    durationMs:  number;
    exitoso:     boolean;
  }): Promise<void> {
    try {
      // Identificar módulo y tabla afectada según la URL
      const { modulo, tabla, registroId } = this.inferirContexto(data.url, data.body, data.response);

      // Determinar acción legible
      const accion = this.metodoAAccion(data.metodo, data.url);

      await this.prisma.auditoriaLog.create({
        data: {
          usuario_id:     data.usuarioId,
          accion:         accion,
          modulo:         modulo,
          tabla_afectada: tabla,
          registro_id:    registroId,
          valor_anterior: data.body?.__anterior ?? null,
          valor_nuevo:    {
            url:        data.url,
            body:       data.body,
            response:   data.response,
            duracion_ms: data.durationMs,
            exitoso:    data.exitoso,
          },
          ip_origen:      data.ip,
          user_agent:     data.userAgent,
          dispositivo:    this.detectarDispositivo(data.userAgent),
          navegador:      this.detectarNavegador(data.userAgent),
        },
      });
    } catch (e) {
      // No detener la request por un error de auditoría
      this.logger.error('Error registrando auditoría:', e);
    }
  }

  // ═══════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════
  private extraerIp(req: Request): string | null {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
    return req.ip || req.socket?.remoteAddress || null;
  }

  private sanitizarBody(body: any): any {
    if (!body) return null;
    // Remover campos sensibles
    const sanitized = { ...body };
    delete sanitized.password;
    delete sanitized.password_hash;
    delete sanitized.token;
    delete sanitized.refresh_token;
    return sanitized;
  }

  private sanitizarResponse(response: any): any {
    if (!response) return null;
    if (Array.isArray(response)) return { tipo: 'array', length: response.length };
    if (typeof response !== 'object') return response;

    const sanitized = { ...response };
    delete sanitized.password;
    delete sanitized.password_hash;
    delete sanitized.accessToken;
    delete sanitized.refreshToken;
    return sanitized;
  }

  private inferirContexto(
    url: string, body: any, response: any,
  ): { modulo: string; tabla: string; registroId: string | null } {
    // Quitar prefijo /api/
    const path = url.replace(/^\/api\//, '');
    const segments = path.split('/').filter(Boolean);

    const modulo = segments[0] ?? 'desconocido';

    // Mapeo modulo → tabla
    const mapa: Record<string, string> = {
      pedidos:     'pedidos',
      productos:   'productos',
      clientes:    'clientes',
      usuarios:    'usuarios',
      vehiculos:   'vehiculos',
      rutas:       'rutas',
      perfil:      'usuarios',
      boletas:     'pedidos',
    };

    const tabla = mapa[modulo] ?? modulo;

    // ID del registro afectado
    let registroId: string | null = null;
    if (segments[1] && /^\d+$/.test(segments[1])) {
      registroId = segments[1];
    } else if (response?.id) {
      registroId = String(response.id);
    }

    return { modulo, tabla, registroId };
  }

  private metodoAAccion(metodo: string, url: string): string {
    if (url.includes('/cancelar')) return 'CANCELAR';
    if (url.includes('/restore'))  return 'RESTAURAR';
    if (url.includes('/estado'))   return 'CAMBIAR_ESTADO';
    if (url.includes('/login'))    return 'LOGIN';
    if (url.includes('/logout'))   return 'LOGOUT';

    const m: Record<string, string> = {
      POST:   'CREAR',
      PATCH:  'EDITAR',
      PUT:    'ACTUALIZAR',
      DELETE: 'ELIMINAR',
    };
    return m[metodo] ?? metodo;
  }

  private detectarDispositivo(ua: string | null): string | null {
    if (!ua) return null;
    if (/mobile/i.test(ua))  return 'móvil';
    if (/tablet/i.test(ua))  return 'tablet';
    if (/windows|mac|linux/i.test(ua)) return 'desktop';
    return 'otro';
  }

  private detectarNavegador(ua: string | null): string | null {
    if (!ua) return null;
    if (/edg\//i.test(ua))      return 'Edge';
    if (/chrome/i.test(ua))     return 'Chrome';
    if (/firefox/i.test(ua))    return 'Firefox';
    if (/safari/i.test(ua))     return 'Safari';
    if (/postman/i.test(ua))    return 'Postman';
    if (/capacitor/i.test(ua))  return 'App móvil';
    return 'Otro';
  }
}