import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
 
@Injectable()
export class VehiculosService {
  private readonly logger = new Logger(VehiculosService.name);
 
  constructor(private prisma: PrismaService) {}
 
  async findAll(soloActivos = true) {
    return this.prisma.vehiculo.findMany({
      where:   soloActivos ? { activo: true } : {},
      orderBy: { matricula: 'asc' },
    });
  }
 
  async findOne(id: number) {
    const v = await this.prisma.vehiculo.findUnique({ where: { id } });
    if (!v) throw new NotFoundException(`Vehículo ${id} no encontrado`);
    return v;
  }
 
  async create(dto: any) {
    return this.prisma.vehiculo.create({
      data: {
        matricula:    String(dto.matricula).toUpperCase().trim(),
        marca:        dto.marca    || undefined,
        modelo:       dto.modelo   || undefined,
        anio:         dto.anio     ? parseInt(dto.anio)     : undefined,
        color:        dto.color    || undefined,
        tipo:         dto.tipo     || undefined,
        capacidad_kg: dto.capacidad_kg ? dto.capacidad_kg : undefined,
        notas:        dto.notas    || undefined,
        activo:       true,
      },
    });
  }
 
  async update(id: number, dto: any) {
    await this.findOne(id);
    return this.prisma.vehiculo.update({
      where: { id },
      data: {
        matricula:    dto.matricula ? String(dto.matricula).toUpperCase().trim() : undefined,
        marca:        dto.marca     !== undefined ? dto.marca     : undefined,
        modelo:       dto.modelo    !== undefined ? dto.modelo    : undefined,
        anio:         dto.anio      !== undefined ? parseInt(dto.anio) : undefined,
        color:        dto.color     !== undefined ? dto.color     : undefined,
        tipo:         dto.tipo      !== undefined ? dto.tipo      : undefined,
        capacidad_kg: dto.capacidad_kg !== undefined ? dto.capacidad_kg : undefined,
        notas:        dto.notas     !== undefined ? dto.notas     : undefined,
        activo:       dto.activo    !== undefined ? Boolean(dto.activo) : undefined,
      },
    });
  }
}