import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators';
import { PedidosService } from './pedidos.service';
import { Delete } from '@nestjs/common';

@Controller('pedidos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PedidosController {
  constructor(private pedidosService: PedidosService) {}

  // ─── STATS ───────────────────────────────────────────────
  // GET /api/pedidos/stats
  @Get('stats')
  @Roles('SUPER_ADMIN', 'ADMIN', 'GERENTE')
  getStats() {
    return this.pedidosService.getStats();
  }

  // GET /pedidos/dashboard-vendedor
  @Get('dashboard-vendedor')
  getDashboard(@Request() req: any) {
    return this.pedidosService.getDashboardVendedor(req.user.id);
  }
  // GET /api/pedidos/dashboard-repartidor
  @Get('dashboard-repartidor')
  @Roles('SUPER_ADMIN', 'ADMIN', 'GERENTE', 'REPARTIDOR')
  getDashboardRepartidor(@Request() req: any) {
    return this.pedidosService.getDashboardRepartidor(req.user.id);
  }

  // GET /api/pedidos/mis-entregas — para repartidor
  @Get('mis-entregas')
  @Roles('SUPER_ADMIN', 'ADMIN', 'GERENTE', 'REPARTIDOR')
  getMisEntregas(@Request() req: any) {
    return this.pedidosService.getMisEntregas(req.user.id);
  }

  // GET /pedidos
  @Get()
  findAll(@Query() query: any, @Request() req: any) {
    return this.pedidosService.findAll(query, req.user.id, req.user.rol);
  }

  // POST /pedidos
  @Post()
  @Roles('SUPER_ADMIN', 'ADMIN', 'GERENTE', 'PREVENTISTA', 'REPARTIDOR')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: any, @Request() req: any) {
    return this.pedidosService.create(dto, req.user.id);
  }

  // PATCH /pedidos/:id — editar notas, descuento, vehículo
  @Patch(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'GERENTE', 'PREVENTISTA', 'REPARTIDOR')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: any,
    @Request() req: any,
  ) {
    return this.pedidosService.update(id, dto, req.user.id, req.user.rol);
  }

  // PATCH /pedidos/:id/estado — cambiar a Preparando, Listo_Carga, En_Ruta
  // Solo admin/gerente (operaciones internas)
  @Patch(':id/estado')
  @Roles('SUPER_ADMIN', 'ADMIN', 'GERENTE', 'ALMACEN')
  cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body('estado') estado: string,
    @Request() req: any,
  ) {
    return this.pedidosService.cambiarEstado(id, estado, req.user.id);
  }

  // PATCH /pedidos/:id/entregar — marca como Entregado y DESCUENTA inventario FIFO
  // El body puede incluir entregas parciales:
  //   { entregas: [{ detalle_id: 1, cantidad: 5 }] }
  // Si no se envía, se asume entrega total de todos los detalles
  @Patch(':id/entregar')
  @Roles('SUPER_ADMIN', 'ADMIN', 'GERENTE', 'REPARTIDOR')
  entregar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: any,
    @Request() req: any,
  ) {
    return this.pedidosService.entregar(id, req.user.id, dto);
  }

  // ─── CANCELAR ────────────────────────────────────────────
  // PATCH /api/pedidos/:id/cancelar
  @Patch(':id/cancelar')
  @Roles('SUPER_ADMIN', 'ADMIN', 'GERENTE', 'PREVENTISTA')
  cancelar(
    @Param('id', ParseIntPipe) id: number,
    @Body('motivo') motivo: string,
    @Request() req: any,
  ) {
    return this.pedidosService.cancelar(id, motivo, req.user.id, req.user.rol);
  }

  // ─── SOFT DELETE ─────────────────────────────────────────
  // DELETE /api/pedidos/:id
  @Delete(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'GERENTE')
  softDelete(
    @Param('id', ParseIntPipe) id: number,
    @Body('motivo') motivo: string,
    @Request() req: any,
  ) {
    return this.pedidosService.softDelete(
      id,
      req.user.id,
      motivo,
      req.user.rol,
    );
  }

  @Patch(':id/listo-carga')
  @Roles('SUPER_ADMIN', 'ADMIN', 'ALMACEN')
  async marcarListoCarga(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    return this.pedidosService.cambiarAListoCarga(id, req.user.id);
  }

  // ─── RESTAURAR ───────────────────────────────────────────
  // PATCH /api/pedidos/:id/restore
  @Patch(':id/restore')
  @Roles('SUPER_ADMIN', 'ADMIN')
  restore(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.pedidosService.restore(id, req.user.rol);
  }

  @Patch(':id/devolver')
  @Roles('SUPER_ADMIN', 'ADMIN', 'GERENTE', 'REPARTIDOR')
  marcarDevolucion(
    @Param('id', ParseIntPipe) id: number,
    @Body('motivo') motivo: string,
    @Request() req: any,
  ) {
    return this.pedidosService.marcarDevolucion(
      id,
      motivo,
      req.user.id,
      req.user.rol,
    );
  }

  // GET /pedidos/:id
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.pedidosService.findOne(id);
  }
  // IMPORTANTE: antes de @Get(':id')
  @Get('entregas-recientes')
  @Roles('SUPER_ADMIN', 'ADMIN', 'GERENTE')
  getEntregasRecientes() {
    return this.pedidosService.getEntregasRecientes(5);
  }
}
