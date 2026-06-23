// src/modules/productos/productos.controller.ts

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
} from '@nestjs/common';
import { JwtAuthGuard }   from '../auth/guards/jwt-auth.guard';
import { RolesGuard }     from '../auth/guards/roles.guard';
import { Roles }          from '../auth/decorators';
import { ProductosService } from './productos.service';  // ← fix: import que faltaba

@Controller('productos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductosController {
  constructor(private readonly productosService: ProductosService) {}

  // GET /productos/stats
  @Get('stats')
  getStats() {
    return this.productosService.getStats();
  }

  // GET /productos/categorias
  @Get('categorias')
  getCategorias() {
    return this.productosService.getCategorias();
  }

  // GET /productos/presentaciones
  @Get('presentaciones')
  getPresentaciones() {
    return this.productosService.getPresentaciones();
  }

  // GET /productos/proveedores
  @Get('proveedores')
  getProveedores() {
    return this.productosService.getProveedores();
  }

  // GET /productos/lotes/:loteId/estado — DEBE IR ANTES de /:id
  @Patch('lotes/:loteId/estado')
  @Roles('SUPER_ADMIN', 'ADMIN', 'ALMACEN')
  updateLoteEstado(
    @Param('loteId', ParseIntPipe) loteId: number,
    @Body('estado') estado: string,
  ) {
    return this.productosService.updateLoteEstado(loteId, estado);
  }

  // POST /productos/lotes — DEBE IR ANTES de /:id
  @Post('lotes')
  @Roles('SUPER_ADMIN', 'ADMIN', 'GERENTE', 'ALMACEN')
  @HttpCode(HttpStatus.CREATED)
  addLote(@Body() dto: any) {
    return this.productosService.addLote(dto);
  }

  // PATCH /productos/presentaciones/:ppId — DEBE IR ANTES de /:id
  @Patch('presentaciones/:ppId')
  @Roles('SUPER_ADMIN', 'ADMIN', 'GERENTE', 'ALMACEN')
  updatePresentacion(
    @Param('ppId', ParseIntPipe) ppId: number,
    @Body() dto: any,
  ) {
    return this.productosService.updatePresentacion(ppId, dto);
  }

  // GET /productos
  @Get()
  findAll(@Query() query: any) {
    return this.productosService.findAll(query);
  }

  // GET /productos/:id
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productosService.findOne(id);
  }

  // POST /productos
  @Post()
  @Roles('SUPER_ADMIN', 'ADMIN', 'GERENTE', 'ALMACEN')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: any) {
    return this.productosService.create(dto);
  }

  // PATCH /productos/:id
  @Patch(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'GERENTE', 'ALMACEN')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: any,
  ) {
    return this.productosService.update(id, dto);
  }

  // PATCH /productos/:id/toggle
  @Patch(':id/toggle')
  @Roles('SUPER_ADMIN', 'ADMIN')
  toggle(
    @Param('id', ParseIntPipe) id: number,
    @Body('activo') activo: boolean,
  ) {
    return this.productosService.toggleActive(id, activo);
  }

  // POST /productos/:id/presentaciones
  @Post(':id/presentaciones')
  @Roles('SUPER_ADMIN', 'ADMIN', 'GERENTE', 'ALMACEN')
  addPresentacion(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: any,
  ) {
    return this.productosService.addPresentacion(id, dto);
  }
}