import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

// ── Helper: convierte cualquier valor a número entero seguro ──
const toInt = (v: any, fallback: number): number => {
  const n = parseInt(String(v ?? fallback), 10);
  return isNaN(n) ? fallback : n;
};

// ── Helper: convierte cualquier valor a boolean seguro ──
const toBool = (v: any): boolean | undefined => {
  if (v === undefined || v === null || v === '') return undefined;
  return String(v) === 'true';
};

@Injectable()
export class ProductosService {
  private readonly logger = new Logger(ProductosService.name);

  constructor(private prisma: PrismaService) {}

  // ─── LISTAR (paginado + filtros) ─────────────────────────────
  async findAll(query: any) {
    try {
      const page = toInt(query.page, 1);
      const limit = toInt(query.limit, 20);
      const skip = (page - 1) * limit;

      // ✅ Construir where desde cero — sin contaminación entre llamadas
      const where: any = {};

      // ── Búsqueda por texto ──────────────────────────────────
      const buscar = String(query.buscar ?? '').trim();
      if (buscar) {
        where.OR = [
          { nombre: { contains: buscar, mode: 'insensitive' } },
          { marca: { contains: buscar, mode: 'insensitive' } },
          { codigo_interno: { contains: buscar, mode: 'insensitive' } },
        ];
      }

      // ── Filtro categoría ────────────────────────────────────
      // Solo aplicar si es un número entero positivo válido
      if (
        query.categoria_id !== undefined &&
        query.categoria_id !== '' &&
        query.categoria_id !== null
      ) {
        const catId = toInt(query.categoria_id, 0);
        if (catId > 0) {
          where.categoria_id = catId;
        }
      }

      // ── Filtro activo ───────────────────────────────────────
      // El cliente envía booleano real (true/false) o no lo envía
      // Si query.activo es undefined → no filtrar (mostrar todos)
      if (query.activo === true || query.activo === false) {
        where.activo = query.activo;
      } else if (query.activo === 'true') {
        where.activo = true;
      } else if (query.activo === 'false') {
        where.activo = false;
      }
      // Si query.activo es undefined, '', null → NO agregar al where → muestra todos

      // ── Filtro marca ────────────────────────────────────────
      const marca = String(query.marca ?? '').trim();
      if (marca) {
        where.marca = { contains: marca, mode: 'insensitive' };
      }

      // ────────────────────────────────────────────────────────
      // ✅ Filtro de Stock Bajo (Marcador)
      // ────────────────────────────────────────────────────────
      if (toBool(query.solo_bajo_stock)) {
        // Productos cuyo stock total esté por debajo del mínimo.
        // Como stock_total se calcula de los lotes, lo hacemos en JS
        // después de obtener los productos (o creamos una subquery).
        // Aquí dejamos un marcador y filtramos abajo.
        (where as any)._filtroStockBajo = true;
      }

      // ── Ordenamiento seguro ─────────────────────────────────
      const validFields = [
        'nombre',
        'marca',
        'precio_compra_promedio',
        'created_at',
      ];
      const orderField = validFields.includes(String(query.orderBy ?? ''))
        ? String(query.orderBy)
        : 'nombre';
      const orderDir = String(query.order ?? '') === 'desc' ? 'desc' : 'asc';

      this.logger.debug(
        `findAll where: ${JSON.stringify(where)} | page:${page} limit:${limit}`,
      );

      // ────────────────────────────────────────────────────────
      // ✅ Consultas a BD ignorando el marcador _filtroStockBajo
      // ────────────────────────────────────────────────────────
      let [total, productos] = await Promise.all([
        this.prisma.producto.count({
          where: { ...where, _filtroStockBajo: undefined },
        }),
        this.prisma.producto.findMany({
          where: { ...where, _filtroStockBajo: undefined },
          skip,
          take: limit,
          orderBy: { [orderField]: orderDir },
          include: {
            categoria: { select: { id: true, nombre: true } },
            presentaciones: {
              include: {
                presentacion: {
                  select: { id: true, nombre: true, siglas: true },
                },
              },
              where: { activo: true },
            },
            lotes: {
              where: { estado: 'Disponible' },
              select: { cantidad_unidades_disponible: true },
            },
          },
        }),
      ]);

      // ────────────────────────────────────────────────────────
      // ✅ Calcular stock total y filtrar si corresponde
      // ────────────────────────────────────────────────────────
      let listaFinal = productos.map((p) => ({
        ...p,
        stock_total: p.lotes.reduce(
          (sum, l) => sum + l.cantidad_unidades_disponible,
          0,
        ),
      }));

      if (toBool(query.solo_bajo_stock)) {
        listaFinal = listaFinal.filter((p) => p.stock_total <= p.stock_minimo);

        // Recalcular total y pages aproximado sobre los resultados filtrados
        total = listaFinal.length;
      }

      return {
        data: listaFinal,
        total,
        page,
        limit,
        pages: Math.ceil(total / limit) || 1, // Garantiza al menos 1 página
      };
    } catch (error) {
      if (error instanceof Error)
        this.logger.error(`findAll: ${error.message}`);
      throw error;
    }
  }

  // ─── OBTENER UNO ─────────────────────────────────────────────
  async findOne(id: number) {
    try {
      const producto = await this.prisma.producto.findUnique({
        where: { id },
        include: {
          categoria: true,
          presentaciones: {
            include: { presentacion: true },
            orderBy: { presentacion: { nombre: 'asc' } },
          },
          lotes: {
            include: {
              proveedor: { select: { id: true, razon_social: true } },
              presentacion: { select: { id: true, nombre: true } },
            },
            orderBy: { fecha_vencimiento: 'asc' },
          },
        },
      });

      if (!producto)
        throw new NotFoundException(`Producto ${id} no encontrado`);
      return producto;
    } catch (error) {
      if (error instanceof Error)
        this.logger.error(`findOne: ${error.message}`);
      throw error;
    }
  }

  // ─── CREAR ───────────────────────────────────────────────────
  async create(dto: any, usuarioId?: number) {
    try {
      if (dto.codigo_interno) {
        const exists = await this.prisma.producto.findUnique({
          where: { codigo_interno: dto.codigo_interno },
        });
        if (exists) throw new ConflictException('El código interno ya existe');
      }

      const producto = await this.prisma.producto.create({
        data: {
          nombre: String(dto.nombre),
          descripcion_corta: dto.descripcion_corta || undefined,
          categoria_id: dto.categoria_id
            ? toInt(dto.categoria_id, 0) || undefined
            : undefined,
          marca: dto.marca || undefined,
          codigo_interno: dto.codigo_interno || undefined,
          precio_compra_promedio: dto.precio_compra_promedio
            ? new Decimal(dto.precio_compra_promedio)
            : undefined,
          margen_ganancia_porcentaje: dto.margen_ganancia_porcentaje
            ? new Decimal(dto.margen_ganancia_porcentaje)
            : new Decimal('28'),
          stock_minimo: dto.stock_minimo ? toInt(dto.stock_minimo, 10) : 10,
          stock_maximo: dto.stock_maximo ? toInt(dto.stock_maximo, 500) : 500,
          dias_para_alerta_vencimiento: dto.dias_para_alerta_vencimiento
            ? toInt(dto.dias_para_alerta_vencimiento, 30)
            : 30,
          activo: true,
        },
        include: { categoria: { select: { id: true, nombre: true } } },
      });

      // ── Auditoría ──
      await this.registrarAuditoria({
        tabla: 'productos',
        registro_id: producto.id,
        accion: 'CREAR',
        descripcion: `Producto creado: ${producto.nombre}`,
        usuario_id: usuarioId,
        datos_nuevos: { nombre: producto.nombre, activo: producto.activo },
      });

      this.logger.log(`Producto creado: ${producto.nombre} (${producto.id})`);
      return producto;
    } catch (error) {
      if (error instanceof Error) this.logger.error(`create: ${error.message}`);
      throw error;
    }
  }

  // ─── ACTUALIZAR ──────────────────────────────────────────────
  async update(id: number, dto: any, usuarioId?: number) {
    try {
      const anterior = await this.findOne(id);

      const producto = await this.prisma.producto.update({
        where: { id },
        data: {
          nombre: dto.nombre ? String(dto.nombre) : undefined,
          descripcion_corta:
            dto.descripcion_corta !== undefined
              ? dto.descripcion_corta
              : undefined,
          categoria_id: dto.categoria_id
            ? toInt(dto.categoria_id, 0) || undefined
            : undefined,
          marca: dto.marca !== undefined ? dto.marca : undefined,
          precio_compra_promedio: dto.precio_compra_promedio
            ? new Decimal(dto.precio_compra_promedio)
            : undefined,
          margen_ganancia_porcentaje: dto.margen_ganancia_porcentaje
            ? new Decimal(dto.margen_ganancia_porcentaje)
            : undefined,
          stock_minimo:
            dto.stock_minimo !== undefined
              ? toInt(dto.stock_minimo, 10)
              : undefined,
          stock_maximo:
            dto.stock_maximo !== undefined
              ? toInt(dto.stock_maximo, 500)
              : undefined,
          dias_para_alerta_vencimiento:
            dto.dias_para_alerta_vencimiento !== undefined
              ? toInt(dto.dias_para_alerta_vencimiento, 30)
              : undefined,
        },
        include: { categoria: { select: { id: true, nombre: true } } },
      });

      // ── Auditoría ──
      await this.registrarAuditoria({
        tabla: 'productos',
        registro_id: id,
        accion: 'EDITAR',
        descripcion: `Producto editado: ${producto.nombre}`,
        usuario_id: usuarioId,
        datos_anteriores: { nombre: anterior.nombre, marca: anterior.marca },
        datos_nuevos: { nombre: producto.nombre, marca: producto.marca },
      });

      this.logger.log(`Producto actualizado: ${id}`);
      return producto;
    } catch (error) {
      if (error instanceof Error) this.logger.error(`update: ${error.message}`);
      throw error;
    }
  }

  // ─── TOGGLE ACTIVO ───────────────────────────────────────────
  async toggleActive(id: number, activo: boolean, usuarioId?: number) {
    try {
      const anterior = await this.findOne(id);

      const producto = await this.prisma.producto.update({
        where: { id },
        data: { activo: Boolean(activo) },
      });

      // ── Auditoría ──
      await this.registrarAuditoria({
        tabla: 'productos',
        registro_id: id,
        accion: activo ? 'ACTIVAR' : 'DESACTIVAR',
        descripcion: `Producto ${activo ? 'activado' : 'desactivado'}: ${anterior.nombre}`,
        usuario_id: usuarioId,
        datos_anteriores: { activo: anterior.activo },
        datos_nuevos: { activo: producto.activo },
      });

      this.logger.log(`Producto ${id} → activo: ${activo}`);
      return { id: producto.id, activo: producto.activo };
    } catch (error) {
      if (error instanceof Error)
        this.logger.error(`toggleActive: ${error.message}`);
      throw error;
    }
  }

  // ─── AGREGAR PRESENTACIÓN ────────────────────────────────────
  async addPresentacion(productoId: number, dto: any, usuarioId?: number) {
    try {
      await this.findOne(productoId);

      const pp = await this.prisma.productoPresentacion.create({
        data: {
          producto_id: productoId,
          presentacion_id: toInt(dto.presentacion_id, 0),
          unidades_equivalentes: new Decimal(dto.unidades_equivalentes),
          precio_venta: new Decimal(dto.precio_venta),
          precio_mayoreo: dto.precio_mayoreo
            ? new Decimal(dto.precio_mayoreo)
            : undefined,
          cantidad_minima_mayoreo: dto.cantidad_minima_mayoreo
            ? toInt(dto.cantidad_minima_mayoreo, 1)
            : 1,
          activo: true,
        },
        include: { presentacion: true },
      });

      await this.registrarAuditoria({
        tabla: 'productos_presentaciones',
        registro_id: pp.id,
        accion: 'CREAR',
        descripcion: `Presentación agregada al producto ${productoId}`,
        usuario_id: usuarioId,
        datos_nuevos: {
          presentacion_id: pp.presentacion_id,
          precio_venta: dto.precio_venta,
        },
      });

      return pp;
    } catch (error) {
      if (error instanceof Error)
        this.logger.error(`addPresentacion: ${error.message}`);
      throw error;
    }
  }

  // ─── EDITAR PRESENTACIÓN ─────────────────────────────────────
  async updatePresentacion(ppId: number, dto: any) {
    try {
      return await this.prisma.productoPresentacion.update({
        where: { id: ppId },
        data: {
          precio_venta: dto.precio_venta
            ? new Decimal(dto.precio_venta)
            : undefined,
          precio_mayoreo: dto.precio_mayoreo
            ? new Decimal(dto.precio_mayoreo)
            : undefined,
          cantidad_minima_mayoreo: dto.cantidad_minima_mayoreo
            ? toInt(dto.cantidad_minima_mayoreo, 1)
            : undefined,
          activo: dto.activo !== undefined ? Boolean(dto.activo) : undefined,
        },
        include: { presentacion: true },
      });
    } catch (error) {
      if (error instanceof Error)
        this.logger.error(`updatePresentacion: ${error.message}`);
      throw error;
    }
  }

  // ─── AGREGAR LOTE ────────────────────────────────────────────
  async addLote(dto: any, usuarioId?: number) {
    try {
      await this.findOne(toInt(dto.producto_id, 0));

      const cantRecibida = toInt(dto.cantidad_recibida_presentacion, 0);
      const unidadesPorPP = toInt(dto.unidades_por_presentacion, 1);
      const unidadesTotal = cantRecibida * unidadesPorPP;
      const costoUnitario = dto.costo_unitario
        ? new Decimal(dto.costo_unitario)
        : undefined;
      const costoTotal = costoUnitario
        ? costoUnitario.times(unidadesTotal)
        : undefined;

      const lote = await this.prisma.lote.create({
        data: {
          producto_id: toInt(dto.producto_id, 0),
          proveedor_id: dto.proveedor_id
            ? toInt(dto.proveedor_id, 0)
            : undefined,
          codigo_lote: String(dto.codigo_lote),
          fecha_vencimiento: new Date(dto.fecha_vencimiento),
          presentacion_recibida_id: toInt(dto.presentacion_recibida_id, 0),
          cantidad_recibida_presentacion: cantRecibida,
          cantidad_unidades_inicial: unidadesTotal,
          cantidad_unidades_disponible: unidadesTotal,
          unidades_por_presentacion: unidadesPorPP,
          costo_unitario: costoUnitario,
          costo_total: costoTotal,
          estado: 'Disponible',
          ubicacion_almacen: dto.ubicacion_almacen || undefined,
          notas: dto.notas || undefined,
        },
        include: {
          proveedor: { select: { id: true, razon_social: true } },
          presentacion: { select: { id: true, nombre: true } },
        },
      });

      await this.registrarAuditoria({
        tabla: 'lotes',
        registro_id: lote.id,
        accion: 'CREAR',
        descripcion: `Lote ${lote.codigo_lote} registrado para producto ${dto.producto_id}`,
        usuario_id: usuarioId,
        datos_nuevos: {
          codigo_lote: lote.codigo_lote,
          cantidad_unidades: unidadesTotal,
          fecha_vencimiento: dto.fecha_vencimiento,
        },
      });

      this.logger.log(
        `Lote creado: ${lote.codigo_lote} → producto ${dto.producto_id}`,
      );
      return lote;
    } catch (error) {
      if (error instanceof Error)
        this.logger.error(`addLote: ${error.message}`);
      throw error;
    }
  }

  // ─── CAMBIAR ESTADO LOTE ─────────────────────────────────────
  async updateLoteEstado(loteId: number, estado: string, usuarioId?: number) {
    try {
      const anterior = await this.prisma.lote.findUnique({
        where: { id: loteId },
      });

      const lote = await this.prisma.lote.update({
        where: { id: loteId },
        data: { estado: estado as any },
      });

      await this.registrarAuditoria({
        tabla: 'lotes',
        registro_id: loteId,
        accion: 'EDITAR',
        descripcion: `Estado del lote ${lote.codigo_lote} cambiado: ${anterior?.estado} → ${estado}`,
        usuario_id: usuarioId,
        datos_anteriores: { estado: anterior?.estado },
        datos_nuevos: { estado },
      });

      return lote;
    } catch (error) {
      if (error instanceof Error)
        this.logger.error(`updateLoteEstado: ${error.message}`);
      throw error;
    }
  }

  // ─── CATÁLOGOS ───────────────────────────────────────────────
  async getCategorias() {
    return this.prisma.categoria.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
      select: { id: true, nombre: true },
    });
  }

  async getPresentaciones() {
    return this.prisma.presentacion.findMany({
      orderBy: { nombre: 'asc' },
      select: { id: true, nombre: true, siglas: true },
    });
  }

  async getProveedores() {
    return this.prisma.proveedor.findMany({
      where: { activo: true },
      orderBy: { razon_social: 'asc' },
      select: { id: true, razon_social: true, nombre_comercial: true },
    });
  }

  // ─── ESTADÍSTICAS ────────────────────────────────────────────
  async getStats() {
    const [total, activos, sinStock, porVencer] = await Promise.all([
      this.prisma.producto.count(),
      this.prisma.producto.count({ where: { activo: true } }),
      this.prisma.producto.count({
        where: {
          activo: true,
          lotes: { none: { estado: 'Disponible' } },
        },
      }),
      this.prisma.lote.count({
        where: {
          estado: 'Disponible',
          fecha_vencimiento: {
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    return {
      total,
      activos,
      inactivos: total - activos,
      sinStock,
      porVencer,
    };
  }

  // ─── AUDITORÍA (helper privado) ──────────────────────────────
  private async registrarAuditoria(params: {
    tabla: string;
    registro_id: string | number;
    accion: string;
    descripcion: string;
    usuario_id?: number;
    datos_anteriores?: object;
    datos_nuevos?: object;
  }) {
    try {
      // usuario_id es requerido en el schema — si no hay, omitir auditoría
      if (!params.usuario_id) return;

      await this.prisma.auditoriaLog.create({
        data: {
          usuario_id: params.usuario_id,
          accion: params.accion,
          modulo: 'INVENTARIO',
          tabla_afectada: params.tabla,
          registro_id: String(params.registro_id),
          valor_anterior: params.datos_anteriores
            ? (params.datos_anteriores as any)
            : undefined,
          valor_nuevo: params.datos_nuevos
            ? (params.datos_nuevos as any)
            : undefined,
          ip_origen: '127.0.0.1',
        },
      });
    } catch (e) {
      // No bloquear la operación principal si la auditoría falla
      this.logger.warn(`Auditoría no registrada: ${e}`);
    }
  }
}
