import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';
export declare class AuditoriaInterceptor implements NestInterceptor {
    private prisma;
    private readonly logger;
    private readonly metodosAuditables;
    private readonly rutasExcluidas;
    constructor(prisma: PrismaService);
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
    private registrarAuditoria;
    private extraerIp;
    private sanitizarBody;
    private sanitizarResponse;
    private inferirContexto;
    private metodoAAccion;
    private detectarDispositivo;
    private detectarNavegador;
}
