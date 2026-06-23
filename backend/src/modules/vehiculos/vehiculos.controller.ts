import {
  Controller, Get, Post, Patch, Param, Body,
  Query, UseGuards, ParseIntPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard }   from '../auth/guards/roles.guard';
import { Roles }        from '../auth/decorators';
import { VehiculosService } from './vehiculos.service';
 
@Controller('vehiculos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VehiculosController {
  constructor(private vehiculosService: VehiculosService) {}
 
  // GET /vehiculos — todos los activos (todos los roles)
  @Get()
  findAll(@Query('todos') todos?: string) {
    return this.vehiculosService.findAll(todos !== 'true');
  }
 
  // GET /vehiculos/:id
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.vehiculosService.findOne(id);
  }
 
  // POST /vehiculos — solo admin
  @Post()
  @Roles('SUPER_ADMIN', 'ADMIN', 'GERENTE')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: any) {
    return this.vehiculosService.create(dto);
  }
 
  // PATCH /vehiculos/:id — solo admin
  @Patch(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'GERENTE')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: any) {
    return this.vehiculosService.update(id, dto);
  }
}