import { PrismaService } from '../../prisma/prisma.service';
export declare class VehiculosService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    findAll(soloActivos?: boolean): Promise<{
        id: number;
        activo: boolean;
        created_at: Date;
        updated_at: Date;
        notas: string | null;
        marca: string | null;
        matricula: string;
        modelo: string | null;
        anio: number | null;
        color: string | null;
        tipo: string | null;
        capacidad_kg: import("@prisma/client/runtime/library").Decimal | null;
    }[]>;
    findOne(id: number): Promise<{
        id: number;
        activo: boolean;
        created_at: Date;
        updated_at: Date;
        notas: string | null;
        marca: string | null;
        matricula: string;
        modelo: string | null;
        anio: number | null;
        color: string | null;
        tipo: string | null;
        capacidad_kg: import("@prisma/client/runtime/library").Decimal | null;
    }>;
    create(dto: any): Promise<{
        id: number;
        activo: boolean;
        created_at: Date;
        updated_at: Date;
        notas: string | null;
        marca: string | null;
        matricula: string;
        modelo: string | null;
        anio: number | null;
        color: string | null;
        tipo: string | null;
        capacidad_kg: import("@prisma/client/runtime/library").Decimal | null;
    }>;
    update(id: number, dto: any): Promise<{
        id: number;
        activo: boolean;
        created_at: Date;
        updated_at: Date;
        notas: string | null;
        marca: string | null;
        matricula: string;
        modelo: string | null;
        anio: number | null;
        color: string | null;
        tipo: string | null;
        capacidad_kg: import("@prisma/client/runtime/library").Decimal | null;
    }>;
}
