import {
  Controller,
  Get,
  Delete,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  BadRequestException,
  Res,
} from '@nestjs/common';
import type { Response as ExpressResponse } from 'express';
import { Response } from 'express';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators';


@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN') // ✅ Solo SUPER_ADMIN puede ver auditoría
export class AuditController {
  constructor(private auditService: AuditService) {}

  // =============================================
  // LISTAR TODOS LOS LOGS
  // =============================================

  /**
   * Listar todos los logs de auditoría (paginado)
   * GET /audit-logs?page=1&limit=50
   * Roles: SUPER_ADMIN
   */
  @Get()
  async getAll(
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 50,
  ) {
    return this.auditService.getAll(page, limit);
  }

  // =============================================
  // OBTENER LOG POR ID
  // =============================================

  /**
   * Obtener log específico por ID
   * GET /audit-logs/:id
   * Roles: SUPER_ADMIN
   */
  @Get(':id')
  async getById(@Param('id') id: string) {
    if (!id) {
      throw new BadRequestException('El ID es requerido');
    }
    return this.auditService.getById(id);
  }

  // =============================================
  // OBTENER LOGS DE UN USUARIO
  // =============================================

  /**
   * Obtener logs de un usuario específico
   * GET /audit-logs/user/:userId?page=1&limit=50
   * Roles: SUPER_ADMIN
   */
  @Get('user/:userId')
  async getByUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 50,
  ) {
    return this.auditService.getByUser(userId, page, limit);
  }

  // =============================================
  // OBTENER LOGS POR ACCIÓN
  // =============================================

  /**
   * Obtener logs filtrados por acción
   * GET /audit-logs/action/:action?page=1&limit=50
   * Ejemplos: LOGIN, CREATE_USER, DELETE_USER, etc
   * Roles: SUPER_ADMIN
   */
  @Get('action/:action')
  async getByAction(
    @Param('action') accion: string,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 50,
  ) {
    if (!accion) {
      throw new BadRequestException('La acción es requerida');
    }
    return this.auditService.getByAction(accion, page, limit);
  }

  // =============================================
  // OBTENER LOGS POR MÓDULO
  // =============================================

  /**
   * Obtener logs filtrados por módulo
   * GET /audit-logs/module/:module?page=1&limit=50
   * Ejemplos: AUTH, USERS, PRODUCTOS, etc
   * Roles: SUPER_ADMIN
   */
  @Get('module/:module')
  async getByModule(
    @Param('module') modulo: string,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 50,
  ) {
    if (!modulo) {
      throw new BadRequestException('El módulo es requerido');
    }
    return this.auditService.getByModule(modulo, page, limit);
  }

  // =============================================
  // OBTENER LOGS POR RANGO DE FECHAS
  // =============================================

  /**
   * Obtener logs entre dos fechas
   * GET /audit-logs/date-range?desde=2024-01-01&hasta=2024-01-31&page=1&limit=50
   * Roles: SUPER_ADMIN
   */
  @Get('date-range')
  async getByDateRange(
    @Query('desde') desde: string,
    @Query('hasta') hasta: string,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 50,
  ) {
    if (!desde || !hasta) {
      throw new BadRequestException(
        'Los parámetros "desde" y "hasta" son requeridos (YYYY-MM-DD)',
      );
    }

    const desdeDate = new Date(desde);
    const hastaDate = new Date(hasta);

    if (isNaN(desdeDate.getTime()) || isNaN(hastaDate.getTime())) {
      throw new BadRequestException(
        'Las fechas deben ser válidas (formato: YYYY-MM-DD)',
      );
    }

    return this.auditService.getByDateRange(desdeDate, hastaDate, page, limit);
  }

  // =============================================
  // OBTENER ESTADÍSTICAS
  // =============================================

  /**
   * Obtener estadísticas de auditoría
   * GET /audit-logs/stats/summary
   * Retorna: totales, top 5 acciones, usuarios, módulos
   * Roles: SUPER_ADMIN
   */
  @Get('stats/summary')
  async getStatistics() {
    return this.auditService.getStatistics();
  }

  // =============================================
  // EXPORTAR A CSV
  // =============================================

  /**
   * Exportar logs en CSV entre dos fechas
   * GET /audit-logs/export/csv?desde=2024-01-01&hasta=2024-01-31
   * Retorna: archivo CSV para descargar
   * Roles: SUPER_ADMIN
   */
  @Get('export/csv')
  @HttpCode(HttpStatus.OK)
  async exportCSV(
    @Query('desde') desde: string,
    @Query('hasta') hasta: string,
    @Res() res: ExpressResponse,
  ) {
    if (!desde || !hasta) {
      throw new BadRequestException(
        'Los parámetros "desde" y "hasta" son requeridos (YYYY-MM-DD)',
      );
    }

    const desdeDate = new Date(desde);
    const hastaDate = new Date(hasta);

    if (isNaN(desdeDate.getTime()) || isNaN(hastaDate.getTime())) {
      throw new BadRequestException(
        'Las fechas deben ser válidas (formato: YYYY-MM-DD)',
      );
    }

    const csv = await this.auditService.exportLogsAsCSV(desdeDate, hastaDate);

    const timestamp = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="audit-logs-${timestamp}.csv"`,
    );
    res.send(csv);
  }

  // =============================================
  // LIMPIAR LOGS ANTIGUOS
  // =============================================

  /**
   * Eliminar logs más antiguos que N días
   * DELETE /audit-logs/cleanup?days=90
   * Roles: SUPER_ADMIN
   * ⚠️ OPERACIÓN DESTRUCTIVA - CUIDADO
   */
  @Delete('cleanup')
  @HttpCode(HttpStatus.OK)
  async deleteOldLogs(
    @Query('days', new ParseIntPipe({ optional: true })) days: number = 90,
  ) {
    if (days < 1) {
      throw new BadRequestException('Days debe ser mayor a 0');
    }

    return this.auditService.deleteOldLogs(days);
  }
}