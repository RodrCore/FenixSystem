import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

const toInt = (v: any, fb = 0) => {
  const n = parseInt(String(v ?? fb), 10);
  return isNaN(n) ? fb : n;
};

@Injectable()
export class PedidosService {
  private readonly logger = new Logger(PedidosService.name);

  constructor(private prisma: PrismaService) {}

  // ── GENERAR NÚMERO ÚNICO ──────────────────────────────────
  private async generarNumero(): Promise<string> {
    const ultimo = await this.prisma.pedido.findFirst({
      orderBy: { id: 'desc' },
      select: { numero_pedido: true },
    });
    const sig = ultimo
      ? parseInt(ultimo.numero_pedido.replace('PDV-', ''), 10) + 1
      : 1;
    return `PDV-${String(sig).padStart(4, '0')}`;
  }

  // ── CALCULAR FECHA DE ENTREGA PROGRAMADA ──────────────────
  // Por defecto: día siguiente. Si es viernes/sábado → lunes
  private calcularFechaEntrega(): Date {
    const hoy = new Date();
    let dia = new Date(hoy);
    dia.setDate(dia.getDate() + 1);
    const diaSemana = dia.getDay(); // 0=domingo, 6=sábado
    if (diaSemana === 0) dia.setDate(dia.getDate() + 1); // domingo → lunes
    if (diaSemana === 6) dia.setDate(dia.getDate() + 2); // sábado → lunes
    return dia;
  }

  async getStats() {
    const hoy0 = new Date();
    hoy0.setHours(0, 0, 0, 0);
    const hoy23 = new Date();
    hoy23.setHours(23, 59, 59, 999);

    const [
      total,
      pendientes,
      en_ruta,
      entregados_hoy,
      cancelados,
      facturadoAgg,
    ] = await Promise.all([
      this.prisma.pedido.count({
        where: { deleted_at: null },
      }),
      this.prisma.pedido.count({
        where: {
          deleted_at: null,
          estado: { in: ['Confirmado', 'Preparando', 'Listo_Carga'] },
        },
      }),
      this.prisma.pedido.count({
        where: { deleted_at: null, estado: 'En_Ruta' },
      }),
      this.prisma.pedido.count({
        where: {
          deleted_at: null,
          estado: { in: ['Entregado_Total', 'Entregado_Parcial'] },
          fecha_entrega_real: { gte: hoy0, lte: hoy23 },
        },
      }),
      this.prisma.pedido.count({
        where: {
          deleted_at: null,
          estado: 'Cancelado',
          fecha_creacion: { gte: hoy0, lte: hoy23 },
        },
      }),
      this.prisma.pedido.aggregate({
        where: {
          deleted_at: null,
          estado: { in: ['Entregado_Total', 'Entregado_Parcial'] },
          fecha_entrega_real: { gte: hoy0, lte: hoy23 },
        },
        _sum: { total_monto: true },
      }),
    ]);

    return {
      total,
      pendientes,
      en_ruta,
      entregados_hoy,
      cancelados,
      facturado_hoy: Number(facturadoAgg._sum.total_monto ?? 0),
    };
  }

  // ── CREAR PEDIDO ──────────────────────────────────────────
  async create(dto: any, usuarioId: number) {
    try {
      const cliente = await this.prisma.cliente.findUnique({
        where: { id: toInt(dto.cliente_id) },
        select: {
          id: true,
          razon_social: true,
          ruta_id: true,
          preventista_asignado_id: true,
        },
      });
      if (!cliente) throw new NotFoundException('Cliente no encontrado');

      if (!dto.detalles?.length) {
        throw new BadRequestException(
          'El pedido debe tener al menos un producto',
        );
      }

      const detalles = dto.detalles as any[];
      let subtotal = new Decimal(0);
      let ivaTotal = new Decimal(0);
      let iepsTotal = new Decimal(0);

      const detallesData = await Promise.all(
        detalles.map(async (d: any) => {
          const pp = await this.prisma.productoPresentacion.findUnique({
            where: { id: toInt(d.presentacion_id) },
            include: {
              producto: {
                select: { iva_porcentaje: true, ieps_porcentaje: true },
              },
            },
          });
          if (!pp)
            throw new BadRequestException(
              `Presentación ${d.presentacion_id} no encontrada`,
            );

          const cantidad = toInt(d.cantidad, 1);
          const precioUnit = new Decimal(d.precio_unitario);
          const subDet = precioUnit.times(cantidad);
          const unidadesEq =
            toInt(pp.unidades_equivalentes.toString()) * cantidad;

          subtotal = subtotal.plus(subDet);

          const ivaPct = pp.producto.iva_porcentaje ?? new Decimal(0);
          const iepsPct = pp.producto.ieps_porcentaje ?? new Decimal(0);
          ivaTotal = ivaTotal.plus(subDet.times(ivaPct).dividedBy(100));
          iepsTotal = iepsTotal.plus(subDet.times(iepsPct).dividedBy(100));

          return {
            producto_id: pp.producto_id,
            presentacion_id: pp.presentacion_id,
            cantidad_presentacion_solicitada: cantidad,
            unidades_equivalentes_totales: unidadesEq,
            precio_unitario_presentacion: precioUnit,
            subtotal_solicitado: subDet,
            estado_linea: 'Pendiente' as const,
          };
        }),
      );

      const descuento = new Decimal(dto.descuento ?? 0);
      const total = subtotal.plus(ivaTotal).plus(iepsTotal).minus(descuento);
      const numero = await this.generarNumero();

      // ✅ Validar repartidor si se asignó
      if (dto.repartidor_id) {
        const repartidor = await this.prisma.usuario.findUnique({
          where: { id: toInt(dto.repartidor_id) },
          select: {
            id: true,
            estado: true,
            rol_id: true,
            rol: { select: { nombre: true } },
          },
        });
        if (!repartidor)
          throw new BadRequestException('Repartidor no encontrado');
        if (!repartidor.estado)
          throw new BadRequestException('Repartidor inactivo');
        if (repartidor.rol?.nombre !== 'REPARTIDOR') {
          throw new BadRequestException('El usuario asignado no es repartidor');
        }
      }

      const pedido = await this.prisma.pedido.create({
        data: {
          numero_pedido: numero,
          cliente_id: cliente.id,
          preventista_id: usuarioId, // ✅ AHORA SÍ
          repartidor_id: dto.repartidor_id
            ? toInt(dto.repartidor_id)
            : undefined, // ✅ NUEVO
          ruta_id: cliente.ruta_id ?? undefined, // ✅ AHORA SÍ
          vehiculo_id: dto.vehiculo_id ? toInt(dto.vehiculo_id) : undefined,
          created_by: usuarioId, // ✅ AHORA SÍ
          estado: 'Confirmado',
          metodo_pago: dto.metodo_pago ?? 'Efectivo',
          estado_pago: 'Pendiente',
          subtotal: subtotal,
          descuento_general: descuento,
          iva_total: ivaTotal,
          ieps_total: iepsTotal,
          total_monto: total.greaterThan(0) ? total : new Decimal(0),
          fecha_confirmacion: new Date(),
          fecha_entrega_programada: dto.fecha_entrega_programada
            ? new Date(dto.fecha_entrega_programada)
            : this.calcularFechaEntrega(),
          notas_pedido: dto.notas || undefined,
          detalles: { create: detallesData },
        },
        include: {
          cliente: {
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
          },
          preventista: {
            select: { id: true, nombres: true, apellido_paterno: true },
          },
          repartidor: {
            select: { id: true, nombres: true, apellido_paterno: true },
          },
          vehiculo: {
            select: {
              id: true,
              matricula: true,
              marca: true,
              modelo: true,
              color: true,
            },
          },
          ruta: { select: { id: true, nombre: true, color_mapa: true } },
          detalles: {
            include: {
              producto: { select: { id: true, nombre: true } },
              presentacion: { select: { id: true, nombre: true } },
            },
          },
        },
      });

      await this.auditoria({
        tabla: 'pedidos',
        registro_id: pedido.id,
        accion: 'CREAR',
        usuario_id: usuarioId,
        descripcion: `Pedido ${numero} creado para cliente ${cliente.razon_social}`,
        datos_nuevos: {
          numero,
          cliente_id: cliente.id,
          total: total.toString(),
          productos: detallesData.length,
          preventista_id: usuarioId,
          repartidor_id: dto.repartidor_id,
          ruta_id: cliente.ruta_id,
        },
      });

      this.logger.log(`Pedido ${numero} creado por usuario ${usuarioId}`);
      return this.mapearPedido(pedido);
    } catch (e) {
      if (e instanceof Error) this.logger.error(`create: ${e.message}`);
      throw e;
    }
  }
  async cambiarAListoCarga(id: number, usuarioId: number) {
    const pedido = await this.prisma.pedido.findUnique({ where: { id } });
    if (!pedido) throw new NotFoundException(`Pedido ${id} no encontrado`);

    if (pedido.estado !== 'Confirmado' && pedido.estado !== 'Preparando') {
      throw new BadRequestException(
        'Solo se pueden marcar como Listo para carga los pedidos Confirmados o en Preparación',
      );
    }

    const actualizado = await this.prisma.pedido.update({
      where: { id },
      data: { estado: 'Listo_Carga' },
      include: {
        cliente: true,
        detalles: { include: { producto: true, presentacion: true } },
      },
    });

    this.logger.log(
      `Pedido ${id} marcado como Listo_Carga por usuario ${usuarioId}`,
    );
    return actualizado;
  }

  // ── MARCAR COMO ENTREGADO + DESCONTAR INVENTARIO FIFO ─────
  async entregar(id: number, usuarioId: number, dto: any = {}) {
    try {
      const pedido = await this.prisma.pedido.findUnique({
        where: { id },
        include: { detalles: true },
      });
      if (!pedido) throw new NotFoundException(`Pedido ${id} no encontrado`);

      if (
        ['Entregado_Total', 'Entregado_Parcial', 'Cancelado'].includes(
          pedido.estado,
        )
      ) {
        throw new BadRequestException(
          `Pedido ya está en estado ${pedido.estado}`,
        );
      }

      // ── TRANSACCIÓN: descontar inventario + actualizar pedido ──
      const resultado = await this.prisma.$transaction(async (tx) => {
        const movimientos: any[] = [];

        for (const detalle of pedido.detalles) {
          // Cantidad real entregada — por defecto = solicitada (entrega total)
          // Si dto.entregas tiene info parcial, usar eso
          const entregaParcial = dto.entregas?.find(
            (e: any) => e.detalle_id === detalle.id,
          );
          const cantidadEntregada = entregaParcial
            ? toInt(entregaParcial.cantidad, 0)
            : detalle.cantidad_presentacion_solicitada;

          if (cantidadEntregada === 0) {
            // Línea no entregada — marcarla pero no descontar
            await tx.detallePedido.update({
              where: { id: detalle.id },
              data: { estado_linea: 'Cancelada' },
            });
            continue;
          }

          // Unidades base a descontar = cantidad × unidades_equivalentes_por_presentacion
          const unidadesADescontar = Math.round(
            (detalle.unidades_equivalentes_totales /
              detalle.cantidad_presentacion_solicitada) *
              cantidadEntregada,
          );

          // ── FIFO: obtener lotes disponibles del producto, ordenados por fecha de vencimiento más cercana ──
          const lotes = await tx.lote.findMany({
            where: {
              producto_id: detalle.producto_id,
              estado: 'Disponible',
              cantidad_unidades_disponible: { gt: 0 },
            },
            orderBy: { fecha_vencimiento: 'asc' },
          });

          const totalDisponible = lotes.reduce(
            (s, l) => s + l.cantidad_unidades_disponible,
            0,
          );

          if (totalDisponible < unidadesADescontar) {
            throw new BadRequestException(
              `Stock insuficiente para producto ${detalle.producto_id}. ` +
                `Necesario: ${unidadesADescontar}, disponible: ${totalDisponible}`,
            );
          }

          let restante = unidadesADescontar;
          let primerLoteUsado: number | null = null;

          for (const lote of lotes) {
            if (restante === 0) break;

            const aDescontar = Math.min(
              lote.cantidad_unidades_disponible,
              restante,
            );
            const stockAnterior = lote.cantidad_unidades_disponible;
            const stockResultante = stockAnterior - aDescontar;

            // Actualizar lote
            await tx.lote.update({
              where: { id: lote.id },
              data: {
                cantidad_unidades_disponible: stockResultante,
                // Si el lote quedó en 0 → marcar Agotado
                estado: stockResultante === 0 ? 'Agotado' : 'Disponible',
              },
            });

            // Registrar movimiento de inventario
            movimientos.push({
              lote_id: lote.id,
              pedido_id: pedido.id,
              usuario_id: usuarioId,
              tipo: 'venta' as const,
              cantidad_unidades: aDescontar,
              stock_anterior: stockAnterior,
              stock_resultante: stockResultante,
              motivo: `Venta de pedido ${pedido.numero_pedido}`,
              costo_unitario: lote.costo_unitario,
              costo_total: lote.costo_unitario
                ? lote.costo_unitario.times(aDescontar)
                : null,
            });

            if (!primerLoteUsado) primerLoteUsado = lote.id;
            restante -= aDescontar;
          }

          // Actualizar detalle del pedido
          await tx.detallePedido.update({
            where: { id: detalle.id },
            data: {
              cantidad_presentacion_entregada: cantidadEntregada,
              unidades_equivalentes_entregadas: unidadesADescontar,
              lote_fifo_utilizado_id: primerLoteUsado,
              estado_linea:
                cantidadEntregada === detalle.cantidad_presentacion_solicitada
                  ? 'Entregada'
                  : 'Entregada', // o crear 'Parcial' si lo necesitas
            },
          });
        }

        // Crear movimientos en bulk
        if (movimientos.length > 0) {
          await tx.movimientoInventario.createMany({ data: movimientos });
        }

        // Determinar estado final: parcial o total
        const algunaParcial = pedido.detalles.some((d) => {
          const ent = dto.entregas?.find((e: any) => e.detalle_id === d.id);
          return (
            ent && toInt(ent.cantidad, 0) < d.cantidad_presentacion_solicitada
          );
        });
        const estadoFinal = algunaParcial
          ? 'Entregado_Parcial'
          : 'Entregado_Total';

        // Actualizar pedido
        const actualizado = await tx.pedido.update({
          where: { id: pedido.id },
          data: {
            estado: estadoFinal,
            fecha_entrega_real: new Date(), // ✅ ahora
            version: { increment: 1 },
          },
          include: {
            cliente: { select: { id: true, razon_social: true } },
            detalles: {
              include: {
                producto: { select: { id: true, nombre: true } },
                presentacion: { select: { id: true, nombre: true } },
              },
            },
          },
        });

        return actualizado;
      });

      await this.auditoria({
        tabla: 'pedidos',
        registro_id: id,
        accion: 'ENTREGAR',
        usuario_id: usuarioId,
        descripcion: `Pedido ${pedido.numero_pedido} marcado como entregado`,
        datos_anteriores: { estado: pedido.estado },
        datos_nuevos: {
          estado: resultado.estado,
          fecha_entrega_real: new Date().toISOString(),
        },
      });

      this.logger.log(
        `Pedido ${pedido.numero_pedido} entregado por usuario ${usuarioId}`,
      );
      return this.mapearPedido(resultado);
    } catch (e) {
      if (e instanceof Error) this.logger.error(`entregar: ${e.message}`);
      throw e;
    }
  }

  async asignarRepartidor(
    pedidoId: number,
    repartidorId: number | null,
    usuarioId: number,
  ) {
    const pedido = await this.prisma.pedido.findUnique({
      where: { id: pedidoId },
    });
    if (!pedido)
      throw new NotFoundException(`Pedido ${pedidoId} no encontrado`);

    // No se puede asignar repartidor a pedidos entregados o cancelados
    if (
      [
        'Entregado_Total',
        'Entregado_Parcial',
        'Cancelado',
        'Devuelto',
      ].includes(pedido.estado)
    ) {
      throw new ForbiddenException(
        `No se puede modificar pedido en estado ${pedido.estado}`,
      );
    }

    // Validar repartidor si se está asignando
    if (repartidorId !== null) {
      const repartidor = await this.prisma.usuario.findUnique({
        where: { id: toInt(repartidorId) },
        select: { id: true, estado: true, rol: { select: { nombre: true } } },
      });
      if (!repartidor)
        throw new BadRequestException('Repartidor no encontrado');
      if (!repartidor.estado)
        throw new BadRequestException('Repartidor inactivo');
      if (repartidor.rol?.nombre !== 'REPARTIDOR') {
        throw new BadRequestException('El usuario asignado no es repartidor');
      }
    }

    const actualizado = await this.prisma.pedido.update({
      where: { id: pedidoId },
      data: {
        repartidor_id: repartidorId !== null ? toInt(repartidorId) : null,
        version: { increment: 1 },
      },
      include: {
        cliente: { select: { id: true, razon_social: true } },
        repartidor: {
          select: { id: true, nombres: true, apellido_paterno: true },
        },
      },
    });

    await this.auditoria({
      tabla: 'pedidos',
      registro_id: pedidoId,
      accion: 'ASIGNAR_REPARTIDOR',
      usuario_id: usuarioId,
      descripcion: repartidorId
        ? `Repartidor asignado al pedido ${pedido.numero_pedido}`
        : `Repartidor desasignado del pedido ${pedido.numero_pedido}`,
      datos_anteriores: { repartidor_id: pedido.repartidor_id },
      datos_nuevos: { repartidor_id: repartidorId },
    });

    return this.mapearPedido(actualizado);
  }

  async getMisEntregas(usuarioId: number) {
    const pedidos = await this.prisma.pedido.findMany({
      where: {
        repartidor_id: usuarioId,
        estado: { in: ['Confirmado', 'Preparando', 'Listo_Carga', 'En_Ruta'] },
      },
      orderBy: [{ fecha_entrega_programada: 'asc' }, { fecha_creacion: 'asc' }],
      include: {
        cliente: {
          select: {
            id: true,
            razon_social: true,
            nombre_comercial: true,
            contacto_telefono: true,
            contacto_whatsapp: true,
            direccion_calle: true,
            direccion_numero: true,
            direccion_ciudad: true,
            direccion_referencias: true,
            latitud: true,
            longitud: true,
          },
        },
        vehiculo: {
          select: {
            id: true,
            matricula: true,
            marca: true,
            modelo: true,
            color: true,
          },
        },
        detalles: {
          include: {
            producto: { select: { id: true, nombre: true } },
            presentacion: { select: { id: true, nombre: true } },
          },
        },
      },
    });

    return pedidos.map((p) => this.mapearPedido(p));
  }
  async getEntregasRecientes(limit = 5) {
    const pedidos = await this.prisma.pedido.findMany({
      where: { estado: { in: ['Entregado_Total', 'Entregado_Parcial'] } },
      orderBy: { fecha_entrega_real: 'desc' },
      take: limit,
      include: {
        cliente: { select: { id: true, razon_social: true } },
        repartidor: {
          select: { id: true, nombres: true, apellido_paterno: true },
        },
      },
    });
    return pedidos.map((p) => this.mapearPedido(p));
  }

  // ── LISTAR PEDIDOS ────────────────────────────────────────
  async findAll(query: any, usuarioId: number, rol: string) {
    const page = Math.max(1, parseInt(query.page ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? '20', 10)));
    const skip = (page - 1) * limit;

    const where: any = {};

    // ✅ Soft delete: excluir eliminados por defecto
    if (query.incluir_eliminados !== 'true') {
      where.deleted_at = null;
    }

    // ✅ Filtro por rol (preventistas y repartidores solo ven los suyos)
    if (rol === 'PREVENTISTA') {
      where.preventista_id = usuarioId;
    } else if (rol === 'REPARTIDOR') {
      where.repartidor_id = usuarioId;
    }
    // SUPER_ADMIN, ADMIN, GERENTE ven todos

    // ✅ Filtro de estado
    if (query.estado) {
      if (query.estado === 'Entregado') {
        // "Entregado" abarca tanto Total como Parcial
        where.estado = { in: ['Entregado_Total', 'Entregado_Parcial'] };
      } else {
        where.estado = query.estado;
      }
    }

    // ✅ Filtro de cliente
    if (query.cliente_id) {
      where.cliente_id = parseInt(query.cliente_id, 10);
    }

    // ✅ Filtro de repartidor (solo admins pueden filtrar por repartidor)
    if (
      query.repartidor_id &&
      ['SUPER_ADMIN', 'ADMIN', 'GERENTE'].includes(rol)
    ) {
      where.repartidor_id = parseInt(query.repartidor_id, 10);
    }

    // ✅ Filtros de fecha
    if (query.desde || query.hasta) {
      where.fecha_creacion = {};
      if (query.desde) where.fecha_creacion.gte = new Date(query.desde);
      if (query.hasta) {
        const hasta = new Date(query.hasta);
        hasta.setHours(23, 59, 59, 999);
        where.fecha_creacion.lte = hasta;
      }
    }

    // ✅ Búsqueda por texto
    if (query.buscar) {
      const q = String(query.buscar).trim();
      where.OR = [
        { numero_pedido: { contains: q, mode: 'insensitive' } },
        { cliente: { razon_social: { contains: q, mode: 'insensitive' } } },
        { cliente: { nombre_comercial: { contains: q, mode: 'insensitive' } } },
        { repartidor: { nombres: { contains: q, mode: 'insensitive' } } },
        { preventista: { nombres: { contains: q, mode: 'insensitive' } } },
      ];
    }

    // ✅ Ordenamiento
    const orderBy: any = {};
    const campoOrden = query.orderBy ?? 'fecha_creacion';
    const direccion = query.order === 'asc' ? 'asc' : 'desc';
    orderBy[campoOrden] = direccion;

    const [data, total] = await Promise.all([
      this.prisma.pedido.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          cliente: {
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
          },
          preventista: {
            select: { id: true, nombres: true, apellido_paterno: true },
          },
          repartidor: {
            select: { id: true, nombres: true, apellido_paterno: true },
          },
          vehiculo: {
            select: { id: true, matricula: true, marca: true, modelo: true },
          },
          ruta: { select: { id: true, nombre: true } },
        },
      }),
      this.prisma.pedido.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    };
  }
  // ─── SOFT DELETE ─────────────────────────────────────────────
  async softDelete(
    id: number,
    usuarioId: number,
    motivo?: string,
    rol?: string,
  ) {
    // Solo SUPER_ADMIN, ADMIN, GERENTE pueden eliminar
    if (!['SUPER_ADMIN', 'ADMIN', 'GERENTE'].includes(rol ?? '')) {
      throw new ForbiddenException('No tienes permiso para eliminar pedidos');
    }

    const pedido = await this.prisma.pedido.findUnique({ where: { id } });
    if (!pedido) throw new NotFoundException('Pedido no encontrado');
    if (pedido.deleted_at) {
      throw new BadRequestException('Este pedido ya está eliminado');
    }

    await this.prisma.pedido.update({
      where: { id },
      data: {
        deleted_at: new Date(),
        deleted_by: usuarioId,
        motivo_eliminacion: motivo ?? 'Sin motivo especificado',
      },
    });

    return { ok: true, message: 'Pedido eliminado correctamente' };
  }

  // ─── RESTAURAR (deshacer soft delete) ────────────────────────
  async restore(id: number, rol?: string) {
    if (!['SUPER_ADMIN', 'ADMIN'].includes(rol ?? '')) {
      throw new ForbiddenException('No tienes permiso para restaurar pedidos');
    }

    const pedido = await this.prisma.pedido.findUnique({ where: { id } });
    if (!pedido) throw new NotFoundException('Pedido no encontrado');
    if (!pedido.deleted_at) {
      throw new BadRequestException('Este pedido no está eliminado');
    }

    return this.prisma.pedido.update({
      where: { id },
      data: {
        deleted_at: null,
        deleted_by: null,
        motivo_eliminacion: null,
      },
    });
  }

  // ─── CANCELAR (cambia estado a Cancelado y revierte inventario) ──
  async cancelar(
    id: number,
    motivo: string | undefined,
    usuarioId: number,
    rol: string,
  ) {
    if (!['SUPER_ADMIN', 'ADMIN', 'GERENTE', 'PREVENTISTA'].includes(rol)) {
      throw new ForbiddenException('No tienes permiso para cancelar pedidos');
    }

    const pedido = await this.prisma.pedido.findUnique({
      where: { id },
      include: { detalles: true },
    });
    if (!pedido) throw new NotFoundException('Pedido no encontrado');
    if (pedido.deleted_at) throw new BadRequestException('Pedido eliminado');
    if (pedido.estado === 'Cancelado') {
      throw new BadRequestException('Este pedido ya está cancelado');
    }
    if (['Entregado_Total', 'Entregado_Parcial'].includes(pedido.estado)) {
      throw new BadRequestException(
        'No se puede cancelar un pedido ya entregado',
      );
    }

    // Si era preventista, solo puede cancelar los suyos en estado Borrador/Confirmado
    if (rol === 'PREVENTISTA') {
      if (pedido.preventista_id !== usuarioId) {
        throw new ForbiddenException(
          'Solo puedes cancelar tus propios pedidos',
        );
      }
      if (!['Borrador', 'Confirmado'].includes(pedido.estado)) {
        throw new BadRequestException('Ya no puedes cancelar este pedido');
      }
    }

    return this.prisma.pedido.update({
      where: { id },
      data: {
        estado: 'Cancelado',
        notas_pedido: pedido.notas_pedido
          ? `${pedido.notas_pedido}\n[CANCELADO: ${motivo ?? 'sin motivo'}]`
          : `[CANCELADO: ${motivo ?? 'sin motivo'}]`,
      },
    });
  }

  // ─── VALIDAR si pedido es editable ───────────────────────────
  private esEditable(estado: string): boolean {
    return ['Borrador', 'Confirmado', 'Preparando', 'Listo_Carga'].includes(
      estado,
    );
  }

  // ── OBTENER UNO ───────────────────────────────────────────
  async findOne(id: number) {
    const pedido = await this.prisma.pedido.findUnique({
      where: { id },
      include: {
        cliente: {
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
        },
        preventista: {
          select: { id: true, nombres: true, apellido_paterno: true },
        },
        repartidor: {
          select: { id: true, nombres: true, apellido_paterno: true },
        },
        vehiculo: {
          select: {
            id: true,
            matricula: true,
            marca: true,
            modelo: true,
            color: true,
          },
        },
        ruta: { select: { id: true, nombre: true } },
        detalles: {
          include: {
            producto: { select: { id: true, nombre: true } },
            presentacion: { select: { id: true, nombre: true } },
          },
        },
      },
    });
    if (!pedido) throw new NotFoundException(`Pedido ${id} no encontrado`);
    return this.mapearPedido(pedido);
  }

  // ── EDITAR ────────────────────────────────────────────────
  async update(id: number, dto: any, usuarioId: number, rol: string) {
    const pedido = await this.prisma.pedido.findUnique({
      where: { id },
      include: { detalles: true },
    });
    if (!pedido) throw new NotFoundException('Pedido no encontrado');
    if (pedido.deleted_at) throw new BadRequestException('Pedido eliminado');

    // ✅ Validar estado editable
    if (
      !['Borrador', 'Confirmado', 'Preparando', 'Listo_Carga'].includes(
        pedido.estado,
      )
    ) {
      throw new BadRequestException(
        'No se puede editar un pedido que ya está en ruta o entregado',
      );
    }

    // ✅ Validar permisos
    if (!['SUPER_ADMIN', 'ADMIN', 'GERENTE', 'PREVENTISTA'].includes(rol)) {
      throw new ForbiddenException('No tienes permiso para editar pedidos');
    }
    if (rol === 'PREVENTISTA' && pedido.preventista_id !== usuarioId) {
      throw new ForbiddenException('Solo puedes editar tus propios pedidos');
    }

    // ✅ Validar repartidor si se asignó
    if (dto.repartidor_id) {
      const repartidor = await this.prisma.usuario.findUnique({
        where: { id: toInt(dto.repartidor_id) },
        select: { id: true, estado: true, rol: { select: { nombre: true } } },
      });
      if (!repartidor)
        throw new BadRequestException('Repartidor no encontrado');
      if (!repartidor.estado)
        throw new BadRequestException('Repartidor inactivo');
      if (repartidor.rol?.nombre !== 'REPARTIDOR') {
        throw new BadRequestException('El usuario asignado no es repartidor');
      }
    }

    // ✅ Si vienen detalles, recalcular totales
    let dataDetalles: any = undefined;
    let nuevoSubtotal: Decimal | undefined;
    let nuevoIva: Decimal | undefined;
    let nuevoIeps: Decimal | undefined;
    let nuevoTotal: Decimal | undefined;

    if (dto.detalles && Array.isArray(dto.detalles)) {
      if (!dto.detalles.length) {
        throw new BadRequestException(
          'El pedido debe tener al menos un producto',
        );
      }

      let subtotal = new Decimal(0);
      let ivaTotal = new Decimal(0);
      let iepsTotal = new Decimal(0);

      const detallesData = await Promise.all(
        dto.detalles.map(async (d: any) => {
          const pp = await this.prisma.productoPresentacion.findUnique({
            where: { id: toInt(d.presentacion_id) },
            include: {
              producto: {
                select: { iva_porcentaje: true, ieps_porcentaje: true },
              },
            },
          });
          if (!pp)
            throw new BadRequestException(
              `Presentación ${d.presentacion_id} no encontrada`,
            );

          const cantidad = toInt(d.cantidad, 1);
          const precioUnit = new Decimal(d.precio_unitario);
          const subDet = precioUnit.times(cantidad);
          const unidadesEq =
            toInt(pp.unidades_equivalentes.toString()) * cantidad;

          subtotal = subtotal.plus(subDet);

          const ivaPct = pp.producto.iva_porcentaje ?? new Decimal(0);
          const iepsPct = pp.producto.ieps_porcentaje ?? new Decimal(0);
          ivaTotal = ivaTotal.plus(subDet.times(ivaPct).dividedBy(100));
          iepsTotal = iepsTotal.plus(subDet.times(iepsPct).dividedBy(100));

          return {
            producto_id: pp.producto_id,
            presentacion_id: pp.presentacion_id,
            cantidad_presentacion_solicitada: cantidad,
            unidades_equivalentes_totales: unidadesEq,
            precio_unitario_presentacion: precioUnit,
            subtotal_solicitado: subDet,
            estado_linea: 'Pendiente' as const,
          };
        }),
      );

      const descuento = new Decimal(
        dto.descuento ?? pedido.descuento_general ?? 0,
      );
      const total = subtotal.plus(ivaTotal).plus(iepsTotal).minus(descuento);

      nuevoSubtotal = subtotal;
      nuevoIva = ivaTotal;
      nuevoIeps = iepsTotal;
      nuevoTotal = total.greaterThan(0) ? total : new Decimal(0);

      dataDetalles = {
        deleteMany: {}, // Eliminar todos los detalles existentes
        create: detallesData, // Crear los nuevos
      };
    }

    // ✅ Construir objeto de update
    const updateData: any = {
      version: { increment: 1 },
    };

    if (dto.repartidor_id !== undefined) {
      updateData.repartidor_id = dto.repartidor_id
        ? toInt(dto.repartidor_id)
        : null;
    }
    if (dto.vehiculo_id !== undefined) {
      updateData.vehiculo_id = dto.vehiculo_id ? toInt(dto.vehiculo_id) : null;
    }
    if (dto.notas !== undefined) {
      updateData.notas_pedido = dto.notas;
    }
    if (dto.descuento !== undefined) {
      updateData.descuento_general = new Decimal(dto.descuento);
    }
    if (dataDetalles) {
      updateData.detalles = dataDetalles;
      updateData.subtotal = nuevoSubtotal;
      updateData.iva_total = nuevoIva;
      updateData.ieps_total = nuevoIeps;
      updateData.total_monto = nuevoTotal;
    }

    return this.prisma.pedido.update({
      where: { id },
      data: updateData,
      include: {
        cliente: {
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
        },
        preventista: {
          select: { id: true, nombres: true, apellido_paterno: true },
        },
        repartidor: {
          select: { id: true, nombres: true, apellido_paterno: true },
        },
        vehiculo: {
          select: { id: true, matricula: true, marca: true, modelo: true },
        },
        ruta: { select: { id: true, nombre: true } },
        detalles: {
          include: {
            producto: { select: { id: true, nombre: true } },
            presentacion: { select: { id: true, nombre: true } },
          },
        },
      },
    });
  }

  async marcarDevolucion(
    id: number,
    motivo: string,
    usuarioId: number,
    rolNombre: string,
  ) {
    const pedido = await this.prisma.pedido.findUnique({
      where: { id },
      include: {
        detalles: true,
        movimientos_inventario: { include: { lote: true } },
      },
    });
    if (!pedido) throw new NotFoundException(`Pedido ${id} no encontrado`);

    // Solo se pueden devolver pedidos entregados
    if (!['Entregado_Total', 'Entregado_Parcial'].includes(pedido.estado)) {
      throw new BadRequestException(
        `Solo se pueden devolver pedidos entregados. Estado actual: ${pedido.estado}`,
      );
    }

    // El repartidor solo puede devolver sus propias entregas
    const esAdmin = ['SUPER_ADMIN', 'ADMIN', 'GERENTE'].includes(rolNombre);
    if (rolNombre === 'REPARTIDOR' && !esAdmin) {
      if (pedido.repartidor_id !== usuarioId) {
        throw new ForbiddenException(
          'Solo puedes devolver pedidos que tú entregaste',
        );
      }
    }

    if (!motivo?.trim()) {
      throw new BadRequestException('El motivo de devolución es obligatorio');
    }

    // ── TRANSACCIÓN: reingresar inventario + actualizar pedido ──
    await this.prisma.$transaction(async (tx) => {
      // Reingresar cada movimiento de venta a su lote original
      for (const mov of pedido.movimientos_inventario) {
        if (mov.tipo !== 'venta') continue;

        const lote = mov.lote;
        const stockAnterior = lote.cantidad_unidades_disponible;
        const stockResultante = stockAnterior + mov.cantidad_unidades;

        await tx.lote.update({
          where: { id: lote.id },
          data: {
            cantidad_unidades_disponible: stockResultante,
            estado: 'Disponible', // por si estaba Agotado
          },
        });

        await tx.movimientoInventario.create({
          data: {
            lote_id: lote.id,
            pedido_id: pedido.id,
            usuario_id: usuarioId,
            tipo: 'devolucion',
            cantidad_unidades: mov.cantidad_unidades,
            stock_anterior: stockAnterior,
            stock_resultante: stockResultante,
            motivo: `Devolución pedido ${pedido.numero_pedido}: ${motivo}`,
          },
        });
      }

      // Marcar detalles como devueltos
      for (const d of pedido.detalles) {
        await tx.detallePedido.update({
          where: { id: d.id },
          data: {
            cantidad_presentacion_devuelta:
              d.cantidad_presentacion_entregada ??
              d.cantidad_presentacion_solicitada,
            motivo_devolucion: motivo,
            estado_linea: 'Devuelta',
          },
        });
      }

      // Actualizar pedido
      await tx.pedido.update({
        where: { id: pedido.id },
        data: {
          estado: 'Devuelto',
          notas_pedido: pedido.notas_pedido
            ? `${pedido.notas_pedido}\n[DEVOLUCIÓN: ${motivo}]`
            : `[DEVOLUCIÓN: ${motivo}]`,
          version: { increment: 1 },
        },
      });
    });

    await this.auditoria({
      tabla: 'pedidos',
      registro_id: id,
      accion: 'DEVOLVER',
      usuario_id: usuarioId,
      descripcion: `Pedido ${pedido.numero_pedido} devuelto: ${motivo}`,
      datos_anteriores: { estado: pedido.estado },
      datos_nuevos: { estado: 'Devuelto', motivo },
    });

    this.logger.log(
      `Pedido ${pedido.numero_pedido} devuelto por usuario ${usuarioId}`,
    );

    return this.findOne(id);
  }
  // ── CAMBIAR ESTADO MANUAL (Preparando, Listo_Carga, En_Ruta) ──
  async cambiarEstado(id: number, estado: string, usuarioId: number) {
    const pedido = await this.prisma.pedido.findUnique({ where: { id } });
    if (!pedido) throw new NotFoundException(`Pedido ${id} no encontrado`);

    const estadosValidos = ['Preparando', 'Listo_Carga', 'En_Ruta'];
    if (!estadosValidos.includes(estado)) {
      throw new BadRequestException(
        `Estado ${estado} no permitido en este endpoint`,
      );
    }

    const actualizado = await this.prisma.pedido.update({
      where: { id },
      data: { estado: estado as any, version: { increment: 1 } },
    });

    await this.auditoria({
      tabla: 'pedidos',
      registro_id: id,
      accion: 'CAMBIAR_ESTADO',
      usuario_id: usuarioId,
      descripcion: `Estado del pedido ${pedido.numero_pedido} cambiado a ${estado}`,
      datos_anteriores: { estado: pedido.estado },
      datos_nuevos: { estado },
    });

    return { id, estado: actualizado.estado };
  }

  // ── DASHBOARD VENDEDOR ────────────────────────────────────
  async getDashboardVendedor(usuarioId: number) {
    const hoy = new Date();
    const inicioHoy = new Date(
      hoy.getFullYear(),
      hoy.getMonth(),
      hoy.getDate(),
    );
    const inicioAyer = new Date(inicioHoy);
    inicioAyer.setDate(inicioAyer.getDate() - 1);

    const [ventasHoy, ventasAyer, ultimosPedidos] = await Promise.all([
      this.prisma.pedido.aggregate({
        where: {
          preventista_id: usuarioId,
          fecha_creacion: { gte: inicioHoy },
          estado: { notIn: ['Cancelado', 'Devuelto'] },
        },
        _sum: { total_monto: true },
        _count: true,
      }),
      this.prisma.pedido.aggregate({
        where: {
          preventista_id: usuarioId,
          fecha_creacion: { gte: inicioAyer, lt: inicioHoy },
          estado: { notIn: ['Cancelado', 'Devuelto'] },
        },
        _sum: { total_monto: true },
      }),
      this.prisma.pedido.findMany({
        where: { preventista_id: usuarioId },
        orderBy: { fecha_creacion: 'desc' },
        take: 5,
        include: { cliente: { select: { id: true, razon_social: true } } },
      }),
    ]);

    return {
      ventas_hoy: Number(ventasHoy._sum.total_monto ?? 0),
      ventas_ayer: Number(ventasAyer._sum.total_monto ?? 0),
      pedidos_hoy: ventasHoy._count,
      ultimos_pedidos: ultimosPedidos.map((p) => this.mapearPedido(p)),
    };
  }

  // ── MAPEAR ────────────────────────────────────────────────
  private mapearPedido(p: any) {
    return {
      id: p.id,
      numero: p.numero_pedido,
      cliente_id: p.cliente_id,
      cliente: p.cliente,
      preventista_id: p.preventista_id,
      preventista: p.preventista,
      repartidor_id: p.repartidor_id,
      repartidor: p.repartidor,
      vehiculo_id: p.vehiculo_id,
      vehiculo: p.vehiculo,
      ruta_id: p.ruta_id,
      ruta: p.ruta,
      estado: p.estado,
      metodo_pago: p.metodo_pago,
      estado_pago: p.estado_pago,
      subtotal: Number(p.subtotal ?? 0),
      descuento: Number(p.descuento_general ?? 0),
      iva_total: Number(p.iva_total ?? 0),
      ieps_total: Number(p.ieps_total ?? 0),
      total: Number(p.total_monto ?? 0),
      notas: p.notas_pedido,
      fecha_creacion: p.fecha_creacion,
      fecha_confirmacion: p.fecha_confirmacion,
      fecha_entrega_programada: p.fecha_entrega_programada,
      fecha_entrega_real: p.fecha_entrega_real,
      created_at: p.fecha_creacion,
      detalles: p.detalles?.map((d: any) => ({
        id: d.id,
        producto_id: d.producto_id,
        presentacion_id: d.presentacion_id,
        cantidad: d.cantidad_presentacion_solicitada,
        cantidad_entregada: d.cantidad_presentacion_entregada,
        precio_unitario: Number(d.precio_unitario_presentacion),
        subtotal: Number(d.subtotal_solicitado),
        estado_linea: d.estado_linea,
        producto: d.producto,
        presentacion: d.presentacion,
      })),
    };
  }

  // ── AUDITORÍA ─────────────────────────────────────────────
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

  async getDashboardRepartidor(usuarioId: number) {
    const hoy = new Date();
    const inicioHoy = new Date(
      hoy.getFullYear(),
      hoy.getMonth(),
      hoy.getDate(),
    );

    const [pendientes, enRuta, entregadosHoy] = await Promise.all([
      this.prisma.pedido.count({
        where: {
          repartidor_id: usuarioId,
          estado: { in: ['Confirmado', 'Preparando', 'Listo_Carga'] },
        },
      }),
      this.prisma.pedido.count({
        where: { repartidor_id: usuarioId, estado: 'En_Ruta' },
      }),
      this.prisma.pedido.count({
        where: {
          repartidor_id: usuarioId,
          fecha_entrega_real: { gte: inicioHoy },
          estado: { in: ['Entregado_Total', 'Entregado_Parcial'] },
        },
      }),
    ]);

    return { pendientes, en_ruta: enRuta, entregados_hoy: entregadosHoy };
  }
}
