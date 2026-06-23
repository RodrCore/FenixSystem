import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const toInt = (v: any, fb = 0) => {
  const n = parseInt(String(v ?? fb), 10);
  return isNaN(n) ? fb : n;
};
const toBool = (v: any) => v === true || v === 'true' || v === 1;
const toDec = (v: any) => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
};

@Injectable()
export class ProveedoresService {
  private readonly logger = new Logger(ProveedoresService.name);

  constructor(private prisma: PrismaService) {}

  // ═══════════════════════════════════════════════
  // LISTAR
  // ═══════════════════════════════════════════════
  async findAll(query: any = {}) {
    const page = toInt(query.page, 1);
    const limit = toInt(query.limit, 20);
    const skip = (page - 1) * limit;

    const where: any = {};

    // Vista: eliminados o normales
    if (toBool(query.eliminados)) {
      where.deleted_at = { not: null };
    } else {
      where.deleted_at = null;
    }

    // Filtro estado activo/inactivo
    if (query.activo !== undefined && query.activo !== '') {
      where.activo = toBool(query.activo);
    }

    // Búsqueda
    if (query.buscar?.trim()) {
      const q = query.buscar.trim();
      where.OR = [
        { razon_social:     { contains: q, mode: 'insensitive' } },
        { nombre_comercial: { contains: q, mode: 'insensitive' } },
        { nit_rfc:          { contains: q, mode: 'insensitive' } },
        { contacto_nombres: { contains: q, mode: 'insensitive' } },
        { contacto_email:   { contains: q, mode: 'insensitive' } },
        { contacto_telefono:{ contains: q } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.proveedor.count({ where }),
      this.prisma.proveedor.findMany({
        where,
        skip,
        take: limit,
        orderBy: { razon_social: 'asc' },
      }),
    ]);

    return {
      data: data.map((p) => this.mapToResponse(p)),
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    };
  }

  // ═══════════════════════════════════════════════
  // OBTENER POR ID (con historial)
  // ═══════════════════════════════════════════════
  async findById(id: number) {
    const proveedor = await this.prisma.proveedor.findUnique({
      where: { id },
      include: {
        eliminador: {
          select: { id: true, nombres: true, apellido_paterno: true },
        },
      },
    });

    if (!proveedor) {
      throw new NotFoundException(`Proveedor ${id} no encontrado`);
    }

    // Historial de órdenes (últimas 10)
    const ordenes = await this.prisma.ordenReabastecimiento.findMany({
      where: { proveedor_id: id, deleted_at: null },
      orderBy: { fecha_solicitud: 'desc' },
      take: 10,
      include: {
        _count: { select: { detalles: true } },
      },
    });

    // Historial de lotes (últimos 10)
    const lotes = await this.prisma.lote.findMany({
      where: { proveedor_id: id },
      orderBy: { fecha_ingreso: 'desc' },
      take: 10,
      include: {
        producto: { select: { id: true, nombre: true, codigo_interno: true } },
      },
    });

    // Estadísticas resumen
    const totalOrdenes = await this.prisma.ordenReabastecimiento.count({
      where: { proveedor_id: id, deleted_at: null },
    });
    const totalLotes = await this.prisma.lote.count({
      where: { proveedor_id: id },
    });

    return {
      ...this.mapToResponseDetailed(proveedor),
      ordenes_recientes: ordenes,
      lotes_recientes: lotes,
      total_ordenes: totalOrdenes,
      total_lotes: totalLotes,
    };
  }

  // ═══════════════════════════════════════════════
  // CREAR
  // ═══════════════════════════════════════════════
  async create(dto: any) {
    // Validar nit_rfc único si viene
    if (dto.nit_rfc?.trim()) {
      const existe = await this.prisma.proveedor.findFirst({
        where: { nit_rfc: dto.nit_rfc.trim() },
      });
      if (existe) {
        throw new ConflictException('El NIT/RFC ya está registrado');
      }
    }

    const data = this.buildData(dto);

    const proveedor = await this.prisma.proveedor.create({ data });
    this.logger.log(`Proveedor creado: ${proveedor.razon_social}`);
    return this.mapToResponse(proveedor);
  }

  // ═══════════════════════════════════════════════
  // ACTUALIZAR
  // ═══════════════════════════════════════════════
  async update(id: number, dto: any) {
    const proveedor = await this.prisma.proveedor.findUnique({ where: { id } });
    if (!proveedor) {
      throw new NotFoundException(`Proveedor ${id} no encontrado`);
    }
    if (proveedor.deleted_at) {
      throw new BadRequestException('No se puede editar un proveedor eliminado');
    }

    // Validar NIT/RFC único si cambia
    if (dto.nit_rfc?.trim() && dto.nit_rfc.trim() !== proveedor.nit_rfc) {
      const existe = await this.prisma.proveedor.findFirst({
        where: { nit_rfc: dto.nit_rfc.trim(), NOT: { id } },
      });
      if (existe) {
        throw new ConflictException('El NIT/RFC ya está registrado');
      }
    }

    const data = this.buildData(dto);

    try {
      const updated = await this.prisma.proveedor.update({
        where: { id },
        data,
      });
      this.logger.log(`Proveedor actualizado: ${updated.razon_social}`);
      return this.mapToResponse(updated);
    } catch (e: any) {
      if (e.code === 'P2002') {
        throw new ConflictException('NIT/RFC ya registrado');
      }
      throw e;
    }
  }

  // ═══════════════════════════════════════════════
  // BUILD DATA (whitelist de campos)
  // ═══════════════════════════════════════════════
  private buildData(dto: any): any {
    const camposString = [
      'razon_social', 'nombre_comercial', 'nit_rfc',
      'contacto_nombres', 'contacto_telefono', 'contacto_email',
      'direccion_completa', 'dias_entrega', 'condiciones_pago', 'notas',
    ];
    const camposNumeric = ['latitud', 'longitud'];
    const camposBool = ['activo'];

    const data: any = {};

    for (const k of camposString) {
      if (dto[k] !== undefined) {
        const v = typeof dto[k] === 'string' ? dto[k].trim() : dto[k];
        data[k] = v === '' ? null : v;
      }
    }
    for (const k of camposNumeric) {
      if (dto[k] !== undefined) {
        data[k] = toDec(dto[k]);
      }
    }
    for (const k of camposBool) {
      if (dto[k] !== undefined) {
        data[k] = toBool(dto[k]);
      }
    }

    return data;
  }

  // ═══════════════════════════════════════════════
  // ACTIVAR / DESACTIVAR
  // ═══════════════════════════════════════════════
  async toggleActive(id: number, activo: boolean) {
    const proveedor = await this.prisma.proveedor.findUnique({ where: { id } });
    if (!proveedor) throw new NotFoundException(`Proveedor ${id} no encontrado`);
    if (proveedor.deleted_at) {
      throw new BadRequestException('No se puede modificar un proveedor eliminado');
    }

    const updated = await this.prisma.proveedor.update({
      where: { id },
      data: { activo },
    });
    return this.mapToResponse(updated);
  }

  // ═══════════════════════════════════════════════
  // SOFT DELETE
  // ═══════════════════════════════════════════════
  async softDelete(id: number, motivo: string, usuarioId: number, rolActual: string) {
    if (rolActual !== 'SUPER_ADMIN' && rolActual !== 'ADMIN') {
      throw new ForbiddenException('No tienes permisos para eliminar proveedores');
    }
    if (!motivo || motivo.trim().length < 3) {
      throw new BadRequestException('El motivo es obligatorio (mínimo 3 caracteres)');
    }

    const proveedor = await this.prisma.proveedor.findUnique({ where: { id } });
    if (!proveedor) throw new NotFoundException(`Proveedor ${id} no encontrado`);
    if (proveedor.deleted_at) {
      throw new BadRequestException('El proveedor ya está eliminado');
    }

    return this.prisma.proveedor.update({
      where: { id },
      data: {
        deleted_at: new Date(),
        deleted_by: usuarioId,
        motivo_eliminacion: motivo.trim(),
        activo: false,
      },
    });
  }

  // ═══════════════════════════════════════════════
  // RESTAURAR
  // ═══════════════════════════════════════════════
  async restore(id: number, rolActual: string) {
    if (rolActual !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Solo SUPER_ADMIN puede restaurar proveedores');
    }

    const proveedor = await this.prisma.proveedor.findUnique({ where: { id } });
    if (!proveedor) throw new NotFoundException(`Proveedor ${id} no encontrado`);
    if (!proveedor.deleted_at) {
      throw new BadRequestException('El proveedor no está eliminado');
    }

    return this.prisma.proveedor.update({
      where: { id },
      data: {
        deleted_at: null,
        deleted_by: null,
        motivo_eliminacion: null,
        activo: false,
      },
    });
  }

  // ═══════════════════════════════════════════════
  // STATS
  // ═══════════════════════════════════════════════
  async getStatistics() {
    const where = { deleted_at: null };

    const [total, activos, inactivos, eliminados] = await Promise.all([
      this.prisma.proveedor.count({ where }),
      this.prisma.proveedor.count({ where: { ...where, activo: true } }),
      this.prisma.proveedor.count({ where: { ...where, activo: false } }),
      this.prisma.proveedor.count({ where: { deleted_at: { not: null } } }),
    ]);

    return { total, activos, inactivos, eliminados };
  }

  // ═══════════════════════════════════════════════
  // MAPPERS
  // ═══════════════════════════════════════════════
  private mapToResponse(p: any) {
    return {
      id: p.id,
      razon_social: p.razon_social,
      nombre_comercial: p.nombre_comercial,
      nit_rfc: p.nit_rfc,
      contacto_nombres: p.contacto_nombres,
      contacto_telefono: p.contacto_telefono,
      contacto_email: p.contacto_email,
      direccion_completa: p.direccion_completa,
      latitud: p.latitud ? Number(p.latitud) : null,
      longitud: p.longitud ? Number(p.longitud) : null,
      dias_entrega: p.dias_entrega,
      condiciones_pago: p.condiciones_pago,
      activo: p.activo,
      notas: p.notas,
      deleted_at: p.deleted_at,
      created_at: p.created_at,
      updated_at: p.updated_at,
    };
  }

  private mapToResponseDetailed(p: any) {
    return {
      ...this.mapToResponse(p),
      deleted_by: p.deleted_by,
      motivo_eliminacion: p.motivo_eliminacion,
      eliminador: p.eliminador,
    };
  }
}