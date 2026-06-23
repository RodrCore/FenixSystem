import { PrismaService } from '../../prisma/prisma.service';
export declare class BoletasService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    generarBoletaPDF(pedidoId: number, usuarioId: number, rolNombre: string): Promise<{
        buffer: Buffer;
        filename: string;
    }>;
    private formatearFecha;
}
