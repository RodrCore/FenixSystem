import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private prisma: PrismaService) {}

  // =============================================
  // LISTAR TODOS LOS LOGS DE AUDITORÍA
  // =============================================

  /**
   * Obtener todos los logs de auditoría
   * Paginado para no sobrecargar
   */
  async getAll(
    page: number = 1,
    limit: number = 50,
  ): Promise<{
    data: any[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  }> {
    try {
      // Validar parámetros
      if (page < 1 || limit < 1) {
        throw new BadRequestException(
          'Page y limit deben ser mayores a 0',
        );
      }

      if (limit > 500) {
        limit = 500; // ✅ Limitar máximo
      }

      const skip = (page - 1) * limit;

      // Obtener total de registros
      const total = await this.prisma.auditoriaLog.count();

      // Obtener logs paginados
      const data = await this.prisma.auditoriaLog.findMany({
        skip,
        take: limit,
        include: {
          usuario: {
            select: {
              id: true,
              email: true,
              nombres: true,
              apellido_paterno: true,
            },
          },
        },
        orderBy: { fecha_hora: 'desc' }, // ✅ Más recientes primero
      });

      const pages = Math.ceil(total / limit);

      this.logger.log(
        `Auditoría consultada: página ${page} de ${pages}`,
      );

      return {
        data,
        total,
        page,
        limit,
        pages,
      };
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Error al obtener auditoría: ${error.message}`);
      } else {
        this.logger.error(`Error desconocido al obtener auditoría`);
      }
      throw error;
    }
  }

  // =============================================
  // OBTENER LOG POR ID
  // =============================================

  async getById(id: string): Promise<any> {
    try {
      if (!id) {
        throw new BadRequestException('El ID es requerido');
      }

      const log = await this.prisma.auditoriaLog.findUnique({
        where: { id },
        include: {
          usuario: {
            select: {
              id: true,
              email: true,
              nombres: true,
              apellido_paterno: true,
            },
          },
        },
      });

      if (!log) {
        throw new NotFoundException(
          `Log de auditoría con ID ${id} no encontrado`,
        );
      }

      return log;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Error al obtener log por ID: ${error.message}`);
      } else {
        this.logger.error(`Error desconocido al obtener log por ID`);
      }
      throw error;
    }
  }

  // =============================================
  // OBTENER LOGS POR USUARIO
  // =============================================

  async getByUser(
    userId: number,
    page: number = 1,
    limit: number = 50,
  ): Promise<{
    data: any[];
    total: number;
    page: number;
    limit: number;
    usuario: any;
  }> {
    try {
      if (!userId) {
        throw new BadRequestException('El userId es requerido');
      }

      if (page < 1 || limit < 1) {
        throw new BadRequestException(
          'Page y limit deben ser mayores a 0',
        );
      }

      if (limit > 500) {
        limit = 500;
      }

      const skip = (page - 1) * limit;

      // Obtener usuario
      const usuario = await this.prisma.usuario.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          nombres: true,
          apellido_paterno: true,
        },
      });

      if (!usuario) {
        throw new NotFoundException(
          `Usuario con ID ${userId} no encontrado`,
        );
      }

      // Obtener logs del usuario
      const total = await this.prisma.auditoriaLog.count({
        where: { usuario_id: userId },
      });

      const data = await this.prisma.auditoriaLog.findMany({
        where: { usuario_id: userId },
        skip,
        take: limit,
        include: {
          usuario: {
            select: {
              id: true,
              email: true,
              nombres: true,
              apellido_paterno: true,
            },
          },
        },
        orderBy: { fecha_hora: 'desc' },
      });

      this.logger.log(
        `Auditoría consultada para usuario ${usuario.email}`,
      );

      return {
        data,
        total,
        page,
        limit,
        usuario,
      };
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `Error al obtener logs por usuario: ${error.message}`,
        );
      } else {
        this.logger.error(`Error desconocido al obtener logs por usuario`);
      }
      throw error;
    }
  }

  // =============================================
  // OBTENER LOGS POR ACCIÓN
  // =============================================

  async getByAction(
    accion: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<{
    data: any[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      if (!accion) {
        throw new BadRequestException('La acción es requerida');
      }

      if (page < 1 || limit < 1) {
        throw new BadRequestException(
          'Page y limit deben ser mayores a 0',
        );
      }

      if (limit > 500) {
        limit = 500;
      }

      const skip = (page - 1) * limit;

      const total = await this.prisma.auditoriaLog.count({
        where: { accion },
      });

      const data = await this.prisma.auditoriaLog.findMany({
        where: { accion },
        skip,
        take: limit,
        include: {
          usuario: {
            select: {
              id: true,
              email: true,
              nombres: true,
              apellido_paterno: true,
            },
          },
        },
        orderBy: { fecha_hora: 'desc' },
      });

      this.logger.log(`Auditoría consultada por acción: ${accion}`);

      return {
        data,
        total,
        page,
        limit,
      };
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Error al obtener logs por acción: ${error.message}`);
      } else {
        this.logger.error(`Error desconocido al obtener logs por acción`);
      }
      throw error;
    }
  }

  // =============================================
  // OBTENER LOGS POR MÓDULO
  // =============================================

  async getByModule(
    modulo: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<{
    data: any[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      if (!modulo) {
        throw new BadRequestException('El módulo es requerido');
      }

      if (page < 1 || limit < 1) {
        throw new BadRequestException(
          'Page y limit deben ser mayores a 0',
        );
      }

      if (limit > 500) {
        limit = 500;
      }

      const skip = (page - 1) * limit;

      const total = await this.prisma.auditoriaLog.count({
        where: { modulo },
      });

      const data = await this.prisma.auditoriaLog.findMany({
        where: { modulo },
        skip,
        take: limit,
        include: {
          usuario: {
            select: {
              id: true,
              email: true,
              nombres: true,
              apellido_paterno: true,
            },
          },
        },
        orderBy: { fecha_hora: 'desc' },
      });

      this.logger.log(`Auditoría consultada por módulo: ${modulo}`);

      return {
        data,
        total,
        page,
        limit,
      };
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `Error al obtener logs por módulo: ${error.message}`,
        );
      } else {
        this.logger.error(`Error desconocido al obtener logs por módulo`);
      }
      throw error;
    }
  }

  // =============================================
  // OBTENER LOGS POR RANGO DE FECHAS
  // =============================================

  async getByDateRange(
    desde: Date,
    hasta: Date,
    page: number = 1,
    limit: number = 50,
  ): Promise<{
    data: any[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      if (!desde || !hasta) {
        throw new BadRequestException(
          'Desde y Hasta (fechas) son requeridas',
        );
      }

      const desdeDate = new Date(desde);
      const hastaDate = new Date(hasta);

      if (desdeDate > hastaDate) {
        throw new BadRequestException(
          'La fecha "desde" no puede ser mayor a "hasta"',
        );
      }

      if (page < 1 || limit < 1) {
        throw new BadRequestException(
          'Page y limit deben ser mayores a 0',
        );
      }

      if (limit > 500) {
        limit = 500;
      }

      const skip = (page - 1) * limit;

      const total = await this.prisma.auditoriaLog.count({
        where: {
          fecha_hora: {
            gte: desdeDate,
            lte: hastaDate,
          },
        },
      });

      const data = await this.prisma.auditoriaLog.findMany({
        where: {
          fecha_hora: {
            gte: desdeDate,
            lte: hastaDate,
          },
        },
        skip,
        take: limit,
        include: {
          usuario: {
            select: {
              id: true,
              email: true,
              nombres: true,
              apellido_paterno: true,
            },
          },
        },
        orderBy: { fecha_hora: 'desc' },
      });

      this.logger.log(
        `Auditoría consultada entre ${desdeDate} y ${hastaDate}`,
      );

      return {
        data,
        total,
        page,
        limit,
      };
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `Error al obtener logs por rango de fechas: ${error.message}`,
        );
      } else {
        this.logger.error(
          `Error desconocido al obtener logs por rango de fechas`,
        );
      }
      throw error;
    }
  }

  // =============================================
  // OBTENER ESTADÍSTICAS DE AUDITORÍA
  // =============================================

  async getStatistics(): Promise<{
    totalLogs: number;
    logsHoy: number;
    logsEstaSemana: number;
    accionesTop5: Array<{ accion: string; cantidad: number }>;
    usuariosTop5: Array<{
      email: string;
      nombres: string;
      cantidad: number;
    }>;
    modulosTop5: Array<{ modulo: string; cantidad: number }>;
  }> {
    try {
      const ahora = new Date();
      const hace24h = new Date(ahora.getTime() - 24 * 60 * 60 * 1000);
      const hace7d = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Total de logs
      const totalLogs = await this.prisma.auditoriaLog.count();

      // Logs hoy
      const logsHoy = await this.prisma.auditoriaLog.count({
        where: {
          fecha_hora: {
            gte: hace24h,
          },
        },
      });

      // Logs esta semana
      const logsEstaSemana = await this.prisma.auditoriaLog.count({
        where: {
          fecha_hora: {
            gte: hace7d,
          },
        },
      });

      // Top 5 acciones
      const accionesRaw = await this.prisma.auditoriaLog.groupBy({
        by: ['accion'],
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
        take: 5,
      });

      const accionesTop5 = accionesRaw.map((item) => ({
        accion: item.accion,
        cantidad: item._count.id,
      }));

      // Top 5 usuarios (requiere query raw)
      const usuariosTop5Raw = await this.prisma.$queryRaw`
        SELECT 
          u.email, 
          u.nombres, 
          COUNT(a.id) as cantidad
        FROM auditoria_logs a
        JOIN usuarios u ON a.usuario_id = u.id
        GROUP BY u.id, u.email, u.nombres
        ORDER BY cantidad DESC
        LIMIT 5
      `;

      const usuariosTop5 = (usuariosTop5Raw as any[]).map((item) => ({
        email: item.email,
        nombres: item.nombres,
        cantidad: parseInt(item.cantidad),
      }));

      // Top 5 módulos
      const modulosRaw = await this.prisma.auditoriaLog.groupBy({
        by: ['modulo'],
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
        take: 5,
      });

      const modulosTop5 = modulosRaw
        .filter((item) => item.modulo !== null)
        .map((item) => ({
          modulo: item.modulo || 'Sin módulo',
          cantidad: item._count.id,
        }));

      this.logger.log('Estadísticas de auditoría obtenidas');

      return {
        totalLogs,
        logsHoy,
        logsEstaSemana,
        accionesTop5,
        usuariosTop5,
        modulosTop5,
      };
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `Error al obtener estadísticas: ${error.message}`,
        );
      } else {
        this.logger.error(`Error desconocido al obtener estadísticas`);
      }
      throw error;
    }
  }

  // =============================================
  // ELIMINAR LOGS ANTIGUOS (LIMPIEZA)
  // =============================================

  async deleteOldLogs(daysOld: number = 90): Promise<{
    deletedCount: number;
  }> {
    try {
      if (daysOld < 1) {
        throw new BadRequestException('daysOld debe ser mayor a 0');
      }

      const fecha = new Date();
      fecha.setDate(fecha.getDate() - daysOld);

      const result = await this.prisma.auditoriaLog.deleteMany({
        where: {
          fecha_hora: {
            lt: fecha,
          },
        },
      });

      this.logger.log(
        `${result.count} logs antiguos eliminados (más de ${daysOld} días)`,
      );

      return {
        deletedCount: result.count,
      };
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Error al eliminar logs antiguos: ${error.message}`);
      } else {
        this.logger.error(`Error desconocido al eliminar logs antiguos`);
      }
      throw error;
    }
  }

  // =============================================
  // EXPORTAR LOGS (CSV)
  // =============================================

  async exportLogsAsCSV(
    desde: Date,
    hasta: Date,
  ): Promise<string> {
    try {
      const desdeDate = new Date(desde);
      const hastaDate = new Date(hasta);

      if (desdeDate > hastaDate) {
        throw new BadRequestException(
          'La fecha "desde" no puede ser mayor a "hasta"',
        );
      }

      const logs = await this.prisma.auditoriaLog.findMany({
        where: {
          fecha_hora: {
            gte: desdeDate,
            lte: hastaDate,
          },
        },
        include: {
          usuario: {
            select: {
              email: true,
              nombres: true,
            },
          },
        },
        orderBy: { fecha_hora: 'asc' },
      });

      // Generar CSV
      const headers = [
        'ID',
        'Usuario',
        'Email',
        'Acción',
        'Módulo',
        'Tabla',
        'Registro ID',
        'IP Origen',
        'Fecha/Hora',
      ];

      const rows = logs.map((log) => [
        log.id,
        log.usuario.nombres,
        log.usuario.email,
        log.accion,
        log.modulo || 'N/A',
        log.tabla_afectada || 'N/A',
        log.registro_id || 'N/A',
        log.ip_origen || 'N/A',
        log.fecha_hora.toISOString(),
      ]);

      const csv =
        [headers, ...rows]
          .map((row) => row.map((cell) => `"${cell}"`).join(','))
          .join('\n') + '\n';

      this.logger.log(`CSV exportado: ${logs.length} registros`);

      return csv;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Error al exportar CSV: ${error.message}`);
      } else {
        this.logger.error(`Error desconocido al exportar CSV`);
      }
      throw error;
    }
  }
}