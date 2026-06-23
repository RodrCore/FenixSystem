import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  BadRequestException,
  Request,
} from '@nestjs/common';
import { UsersService } from './user.service';
import { CreateUserDto } from '../auth/dto/create-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  // ═══════════════════════════════════════════════
  // LISTAR (con filtros + paginación)
  // ═══════════════════════════════════════════════
  @Get()
  @Roles('ADMIN', 'SUPER_ADMIN')
  async findAll(@Query() query: any) {
    return this.usersService.findAll(query);
  }

  // ═══════════════════════════════════════════════
  // ESTADÍSTICAS
  // ═══════════════════════════════════════════════
  @Get('stats')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getStats() {
    return this.usersService.getStatistics();
  }

  // Compatibilidad: /users/stats/all
  @Get('stats/all')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getStatistics() {
    return this.usersService.getStatistics();
  }

  // ═══════════════════════════════════════════════
  // ROLES (para dropdowns)
  // ═══════════════════════════════════════════════
  @Get('roles')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async listRoles() {
    return this.usersService.listRoles();
  }

  // ═══════════════════════════════════════════════
  // REPARTIDORES (mantener)
  // ═══════════════════════════════════════════════
  @Get('repartidores')
  @Roles('SUPER_ADMIN', 'ADMIN', 'GERENTE', 'PREVENTISTA')
  getRepartidores() {
    return this.usersService.getRepartidores();
  }

  // ═══════════════════════════════════════════════
  // POR EMAIL
  // ═══════════════════════════════════════════════
  @Get('email/:email')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async findByEmail(@Param('email') email: string) {
    if (!email) throw new BadRequestException('El email es requerido');
    return this.usersService.findByEmail(email);
  }

  // ═══════════════════════════════════════════════
  // POR ROL
  // ═══════════════════════════════════════════════
  @Get('rol/:rolNombre')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async findByRole(@Param('rolNombre') rolNombre: string) {
    if (!rolNombre)
      throw new BadRequestException('El nombre del rol es requerido');
    return this.usersService.findByRole(rolNombre);
  }

  // ═══════════════════════════════════════════════
  // OBTENER POR ID (debe ir DESPUÉS de las rutas específicas)
  // ═══════════════════════════════════════════════
  @Get(':id')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async findById(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findById(id);
  }

  // ═══════════════════════════════════════════════
  // CREAR
  // ═══════════════════════════════════════════════
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async createUser(
    @Body() createUserDto: CreateUserDto & { ci?: string },
    @Request() req: any,
  ) {
    if (!createUserDto.rol_id) {
      throw new BadRequestException('El rol_id es requerido');
    }
    // ADMIN no puede crear SUPER_ADMIN — el service lo validará también
    return this.usersService.createUser(createUserDto);
  }

  // ═══════════════════════════════════════════════
  // CREAR ADMIN (mantener)
  // ═══════════════════════════════════════════════
  @Post('admin')
  @HttpCode(HttpStatus.CREATED)
  @Roles('SUPER_ADMIN')
  async createAdmin(@Body() createAdminDto: CreateUserDto & { ci?: string }) {
    return this.usersService.createAdmin(createAdminDto);
  }

  // ═══════════════════════════════════════════════
  // ACTUALIZAR
  // ═══════════════════════════════════════════════
  @Patch(':id')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: any,
    @Request() req: any,
  ) {
    return this.usersService.update(
      id,
      updateUserDto,
      req.user.rol,
      req.user.id,
    );
  }

  // ═══════════════════════════════════════════════
  // ACTIVAR / DESACTIVAR
  // ═══════════════════════════════════════════════
  @Patch(':id/toggle-active')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async toggleActive(
    @Param('id', ParseIntPipe) id: number,
    @Body('estado') estado: boolean,
    @Request() req: any,
  ) {
    if (typeof estado !== 'boolean') {
      throw new BadRequestException('El campo "estado" debe ser boolean');
    }
    return this.usersService.toggleActive(
      id,
      estado,
      req.user.rol,
      req.user.id, // ✅ AGREGAR este parámetro
    );
  }

  // ═══════════════════════════════════════════════
  // CAMBIAR ROL (solo SUPER_ADMIN)
  // ═══════════════════════════════════════════════
  @Patch(':id/change-role')
  @Roles('SUPER_ADMIN')
  async changeRole(
    @Param('id', ParseIntPipe) userId: number,
    @Body('rolId', ParseIntPipe) rolId: number,
  ) {
    if (!userId || !rolId) {
      throw new BadRequestException('userId y rolId son requeridos');
    }
    return this.usersService.changeRole(userId, rolId);
  }

  // ═══════════════════════════════════════════════
  // RESETEAR PASSWORD
  // ═══════════════════════════════════════════════
  @Post(':id/reset-password')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async resetPassword(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    return this.usersService.resetPassword(id, req.user.rol);
  }

  // ═══════════════════════════════════════════════
  // ELIMINAR (SOFT DELETE)
  // ═══════════════════════════════════════════════
  @Delete(':id')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async softDelete(
    @Param('id', ParseIntPipe) id: number,
    @Body('motivo') motivo: string,
    @Request() req: any,
  ) {
    return this.usersService.softDelete(id, motivo, req.user.id, req.user.rol);
  }

  // ═══════════════════════════════════════════════
  // RESTAURAR (solo SUPER_ADMIN)
  // ═══════════════════════════════════════════════
  @Patch(':id/restore')
  @Roles('SUPER_ADMIN')
  async restore(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.usersService.restore(id, req.user.rol);
  }
}
