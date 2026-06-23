import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ForbiddenException, BadRequestException } from '@nestjs/common';

const toInt = (v: any, fb: number) => {
  const n = parseInt(String(v ?? fb), 10);
  return isNaN(n) ? fb : n;
};
const toBool = (v: any) => v === true || v === 'true';

@Injectable()
export class ClientesService {
  private readonly logger = new Logger(ClientesService.name);

  constructor(private prisma: PrismaService) {}

  async getStats() {
    const where = { deleted_at: null };

    const [total, activos, inactivos, conDeuda, deudaTotal] = await Promise.all(
      [
        this.prisma.cliente.count({ where }),
        this.prisma.cliente.count({ where: { ...where, estado: 'Activo' } }),
        this.prisma.cliente.count({ where: { ...where, estado: 'Inactivo' } }),
        this.prisma.cliente.count({
          where: { ...where, saldo_pendiente: { gt: 0 } },
        }),
        this.prisma.cliente.aggregate({
          where: { ...where, saldo_pendiente: { gt: 0 } },
          _sum: { saldo_pendiente: true },
        }),
      ],
    );

    return {
      total,
      activos,
      inactivos,
      con_deuda: conDeuda,
      deuda_total: Number(deudaTotal._sum.saldo_pendiente ?? 0),
    };
  }

  async buscar(q: string) {
    if (!q || q.trim().length < 2) return [];

    return this.prisma.cliente.findMany({
      where: {
        estado: 'Activo',
        OR: [
          { razon_social: { contains: q.trim(), mode: 'insensitive' } },
          { nombre_comercial: { contains: q.trim(), mode: 'insensitive' } },
          { contacto_telefono: { contains: q.trim() } },
        ],
      },
      select: {
        id: true,
        razon_social: true,
        nombre_comercial: true,
        contacto_telefono: true,
        direccion_calle: true,
        direccion_ciudad: true,
        latitud: true,
        longitud: true,
      },
      take: 20,
      orderBy: { razon_social: 'asc' },
    });
  }

  // ── LISTAR ─────────────────────────────────────────────────
  async findAll(query: any) {
    const page = toInt(query.page, 1);
    const limit = toInt(query.limit, 20);
    const skip = (page - 1) * limit;

    const where: any = {};

    // ✅ Por defecto excluir eliminados
    if (!toBool(query.incluir_eliminados)) {
      where.deleted_at = null;
    }

    if (query.buscar?.trim()) {
      where.OR = [
        { razon_social: { contains: query.buscar, mode: 'insensitive' } },
        { nombre_comercial: { contains: query.buscar, mode: 'insensitive' } },
        { contacto_telefono: { contains: query.buscar, mode: 'insensitive' } },
        { contacto_nombres: { contains: query.buscar, mode: 'insensitive' } },
        { nit_rfc: { contains: query.buscar, mode: 'insensitive' } },
      ];
    }

    if (query.estado) where.estado = query.estado;

    // ✅ Filtro: solo con deuda
    if (toBool(query.con_deuda)) {
      where.saldo_pendiente = { gt: 0 };
    }

    // ✅ Filtro: solo con crédito habilitado
    if (toBool(query.con_credito)) {
      where.credito_habilitado = true;
    }

    // ✅ Filtro: por tipo de cliente
    if (query.tipo_cliente) {
      where.tipo_cliente = query.tipo_cliente;
    }

    const [total, data] = await Promise.all([
      this.prisma.cliente.count({ where }),
      this.prisma.cliente.findMany({
        where,
        skip,
        take: limit,
        orderBy: { razon_social: 'asc' },
        // (mantén el select que ya tenías)
      }),
    ]);

    return {
      data,
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    };
  }

  // ── OBTENER UNO ────────────────────────────────────────────
  async findOne(id: number) {
    const cliente = await this.prisma.cliente.findUnique({
      where: { id },
      include: {
        eliminador: {
          select: { id: true, nombres: true, apellido_paterno: true },
        },
        // Últimos 10 pedidos del cliente
        pedidos: {
          where: { deleted_at: null },
          take: 10,
          orderBy: { fecha_creacion: 'desc' },
          select: {
            id: true,
            numero_pedido: true,
            fecha_creacion: true,
            estado: true,
            total_monto: true,
            estado_pago: true,
          },
        },
      },
    });

    if (!cliente) {
      throw new NotFoundException(`Cliente ${id} no encontrado`);
    }

    return cliente;
  }

  // ── CREAR ──────────────────────────────────────────────────
  async create(dto: any, usuarioId: number) {
    // Validación mínima
    if (!dto.razon_social || !dto.razon_social.trim()) {
      throw new BadRequestException('La razón social es obligatoria');
    }
    if (!dto.contacto_telefono || !dto.contacto_telefono.trim()) {
      throw new BadRequestException('El teléfono es obligatorio');
    }

    const camposString = [
      'razon_social',
      'nombre_comercial',
      'nit_rfc',
      'regimen_fiscal',
      'tipo_cliente',
      'contacto_nombres',
      'contacto_apellido_paterno',
      'contacto_apellido_materno',
      'contacto_telefono',
      'contacto_whatsapp',
      'contacto_email',
      'direccion_calle',
      'direccion_numero',
      'direccion_colonia',
      'direccion_ciudad',
      'direccion_codigo_postal',
      'direccion_referencias',
      'dias_entrega',
      'notas_internas',
    ];

    const camposNumeric = [
      'limite_credito',
      'dias_credito',
      'latitud',
      'longitud',
      'preventista_asignado_id',
      'ruta_id',
      'tiempo_promedio_entrega_minutos',
    ];

    const camposBool = ['credito_habilitado', 'lista_precios_especial'];

    const camposDateTime = [
      'horario_recepcion_desde',
      'horario_recepcion_hasta',
    ];

    const data: any = {
      estado: dto.estado === 'Inactivo' ? 'Inactivo' : 'Activo',
    };

    for (const k of camposString) {
      if (dto[k] !== undefined && dto[k] !== null && dto[k] !== '') {
        data[k] = dto[k];
      }
    }
    for (const k of camposNumeric) {
      if (dto[k] !== undefined && dto[k] !== null && dto[k] !== '') {
        data[k] = Number(dto[k]);
      }
    }
    for (const k of camposBool) {
      if (dto[k] !== undefined) {
        data[k] = toBool(dto[k]);
      }
    }
    for (const k of camposDateTime) {
      if (dto[k] !== undefined && dto[k] !== null && dto[k] !== '') {
        data[k] = new Date(dto[k]);
      }
    }

    // Defaults para campos requeridos del schema
    if (data.credito_habilitado === undefined) data.credito_habilitado = false;
    if (data.dias_credito === undefined) data.dias_credito = 0;
    if (data.saldo_pendiente === undefined) data.saldo_pendiente = 0;

    try {
      const cliente = await this.prisma.cliente.create({ data });
      this.logger.log(`Cliente ${cliente.id} creado por usuario ${usuarioId}`);
      return cliente;
    } catch (e: any) {
      if (e.code === 'P2002') {
        throw new ConflictException('El NIT/RFC ya está registrado');
      }
      throw e;
    }
  }

  // ── ACTUALIZAR ─────────────────────────────────────────────
  async update(id: number, dto: any, usuarioId: number) {
    // Verificar que existe
    const anterior = await this.prisma.cliente.findUnique({
      where: { id },
      select: { id: true, deleted_at: true },
    });
    if (!anterior) {
      throw new NotFoundException(`Cliente ${id} no encontrado`);
    }
    if (anterior.deleted_at) {
      throw new BadRequestException('No se puede editar un cliente eliminado');
    }

    // ✅ Whitelist de campos editables (strings)
    const camposString = [
      'razon_social',
      'nombre_comercial',
      'nit_rfc',
      'regimen_fiscal',
      'tipo_cliente',
      'contacto_nombres',
      'contacto_apellido_paterno',
      'contacto_apellido_materno',
      'contacto_telefono',
      'contacto_whatsapp',
      'contacto_email',
      'direccion_calle',
      'direccion_numero',
      'direccion_colonia',
      'direccion_ciudad',
      'direccion_codigo_postal',
      'direccion_referencias',
      'dias_entrega',
      'notas_internas',
      'estado',
    ];

    // Campos numéricos
    const camposNumeric = [
      'limite_credito',
      'dias_credito',
      'latitud',
      'longitud',
      'preventista_asignado_id',
      'ruta_id',
      'tiempo_promedio_entrega_minutos',
    ];

    // Campos booleanos
    const camposBool = ['credito_habilitado', 'lista_precios_especial'];

    // Campos datetime (horarios)
    const camposDateTime = [
      'horario_recepcion_desde',
      'horario_recepcion_hasta',
    ];

    const data: any = {};

    // String fields: aceptan string vacío como null
    for (const k of camposString) {
      if (dto[k] !== undefined) {
        data[k] = dto[k] === '' ? null : dto[k];
      }
    }

    // Numeric fields
    for (const k of camposNumeric) {
      if (dto[k] !== undefined && dto[k] !== null && dto[k] !== '') {
        data[k] = Number(dto[k]);
      } else if (dto[k] === null || dto[k] === '') {
        data[k] = null;
      }
    }

    // Bool fields
    for (const k of camposBool) {
      if (dto[k] !== undefined) {
        data[k] = toBool(dto[k]);
      }
    }

    // DateTime fields (horarios vienen como ISO string)
    for (const k of camposDateTime) {
      if (dto[k] !== undefined && dto[k] !== null && dto[k] !== '') {
        data[k] = new Date(dto[k]);
      } else if (dto[k] === null || dto[k] === '') {
        data[k] = null;
      }
    }

    try {
      const cliente = await this.prisma.cliente.update({
        where: { id },
        data,
      });

      this.logger.log(
        `Cliente ${id} actualizado por usuario ${usuarioId}: ${Object.keys(data).join(', ')}`,
      );

      return cliente;
    } catch (e: any) {
      // NIT/RFC duplicado
      if (e.code === 'P2002') {
        throw new ConflictException(
          'El NIT/RFC ya está registrado en otro cliente',
        );
      }
      throw e;
    }
  }

  async softDelete(id: number, motivo: string, usuarioId: number, rol: string) {
    if (!['SUPER_ADMIN', 'ADMIN', 'GERENTE'].includes(rol)) {
      throw new ForbiddenException('No tienes permisos para eliminar clientes');
    }

    const cliente = await this.prisma.cliente.findUnique({
      where: { id },
      select: { id: true, deleted_at: true, razon_social: true },
    });

    if (!cliente) {
      throw new NotFoundException(`Cliente ${id} no encontrado`);
    }
    if (cliente.deleted_at) {
      throw new BadRequestException('El cliente ya está eliminado');
    }
    if (!motivo || motivo.trim().length < 3) {
      throw new BadRequestException('Motivo de eliminación obligatorio');
    }

    // Verificar si tiene pedidos activos (no entregados, no cancelados)
    const pedidosActivos = await this.prisma.pedido.count({
      where: {
        cliente_id: id,
        deleted_at: null,
        estado: {
          in: [
            'Borrador',
            'Confirmado',
            'Preparando',
            'Listo_Carga',
            'En_Ruta',
          ],
        },
      },
    });

    if (pedidosActivos > 0) {
      throw new BadRequestException(
        `No se puede eliminar: el cliente tiene ${pedidosActivos} pedido(s) activo(s). Cancélalos primero.`,
      );
    }

    return this.prisma.cliente.update({
      where: { id },
      data: {
        deleted_at: new Date(),
        deleted_by: usuarioId,
        motivo_eliminacion: motivo.trim(),
        estado: 'Inactivo', // ✅ También cambia el estado
      },
    });
  }

  async restore(id: number, rol: string) {
    if (rol !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Solo SUPER_ADMIN puede restaurar clientes');
    }

    const cliente = await this.prisma.cliente.findUnique({
      where: { id },
      select: { id: true, deleted_at: true },
    });

    if (!cliente) throw new NotFoundException(`Cliente ${id} no encontrado`);
    if (!cliente.deleted_at) {
      throw new BadRequestException('El cliente no está eliminado');
    }

    return this.prisma.cliente.update({
      where: { id },
      data: {
        deleted_at: null,
        deleted_by: null,
        motivo_eliminacion: null,
        estado: 'Activo',
      },
    });
  }

  // ── CAMBIAR ESTADO ─────────────────────────────────────────
  async cambiarEstado(id: number, estado: string, usuarioId: number) {
    try {
      const anterior = await this.findOne(id);

      const cliente = await this.prisma.cliente.update({
        where: { id },
        data: { estado: estado as any },
      });

      await this.auditoria({
        tabla: 'clientes',
        registro_id: id,
        accion: estado === 'Activo' ? 'ACTIVAR' : 'DESACTIVAR',
        usuario_id: usuarioId,
        descripcion: `Cliente ${estado === 'Activo' ? 'activado' : 'desactivado'}: ${anterior.razon_social}`,
        datos_anteriores: { estado: anterior.estado },
        datos_nuevos: { estado },
      });

      return { id: cliente.id, estado: cliente.estado };
    } catch (error) {
      if (error instanceof Error)
        this.logger.error(`cambiarEstado: ${error.message}`);
      throw error;
    }
  }

  // ── AUDITORÍA ──────────────────────────────────────────────
  private async auditoria(p: {
    tabla: string;
    registro_id: number;
    accion: string;
    descripcion: string;
    usuario_id: number;
    datos_anteriores?: object;
    datos_nuevos?: object;
  }) {
    if (!p.usuario_id) {
      this.logger.warn(`Auditoría sin usuario_id, saltando registro`);
      return;
    }
    try {
      await this.prisma.auditoriaLog.create({
        data: {
          accion: p.accion,
          modulo: 'PEDIDOS',
          tabla_afectada: p.tabla,
          registro_id: String(p.registro_id),
          valor_anterior: p.datos_anteriores
            ? (p.datos_anteriores as any)
            : undefined,
          valor_nuevo: p.datos_nuevos ? (p.datos_nuevos as any) : undefined,
          ip_origen: '127.0.0.1',
          usuario: { connect: { id: p.usuario_id } }, // ← usar relación connect
        },
      });
    } catch (e) {
      this.logger.warn(`Auditoría no registrada: ${e}`);
    }
  }
}
