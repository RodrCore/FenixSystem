import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { CreateUserDto } from '../auth/dto/create-user.dto';

// Helper para parsear int
const toInt = (v: any, fb = 0) => {
  const n = parseInt(String(v ?? fb), 10);
  return isNaN(n) ? fb : n;
};
const toBool = (v: any) => v === true || v === 'true' || v === 1;

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
  ) {}

  // ═══════════════════════════════════════════════
  // GENERADOR DE PASSWORD TEMPORAL
  // ═══════════════════════════════════════════════
  private generarPasswordTemporal(): string {
    // Formato: ABC1-XYZ8 (8 caracteres con guión)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin 0/O, 1/I, l
    const random = (n: number) =>
      Array.from(
        { length: n },
        () => chars[Math.floor(Math.random() * chars.length)],
      ).join('');
    return `${random(4)}-${random(4)}`;
  }

  // ═══════════════════════════════════════════════
  // LISTAR — con filtros, búsqueda, paginación
  // ═══════════════════════════════════════════════
  async findAll(query: any = {}) {
    const page = toInt(query.page, 1);
    const limit = toInt(query.limit, 20);
    const skip = (page - 1) * limit;

    const where: any = {};

    // ✅ FILTRO POR VISTA: activos+inactivos | eliminados
    if (toBool(query.eliminados)) {
      // Vista de eliminados: solo los que tienen deleted_at
      where.deleted_at = { not: null };
    } else {
      // Vista normal: NO eliminados
      where.deleted_at = null;
    }

    // Filtro de estado (activo/inactivo) — solo aplica cuando no estamos viendo eliminados
    if (query.estado !== undefined && query.estado !== '') {
      where.estado = toBool(query.estado);
    }

    // Filtro por rol
    if (query.rol) {
      where.rol = { nombre: query.rol };
    }

    // Búsqueda libre
    if (query.buscar?.trim()) {
      const q = query.buscar.trim();
      where.OR = [
        { nombres: { contains: q, mode: 'insensitive' } },
        { apellido_paterno: { contains: q, mode: 'insensitive' } },
        { apellido_materno: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { ci: { contains: q, mode: 'insensitive' } },
        { numero_empleado: { contains: q, mode: 'insensitive' } },
        { telefono: { contains: q } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.usuario.count({ where }),
      this.prisma.usuario.findMany({
        where,
        skip,
        take: limit,
        orderBy: { apellido_paterno: 'asc' },
        include: {
          rol: {
            select: {
              id: true,
              nombre: true,
              descripcion: true,
              nivel_jerarquico: true,
            },
          },
        },
      }),
    ]);

    return {
      data: data.map((u) => this.mapToResponse(u)),
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    };
  }

  // ═══════════════════════════════════════════════
  // OBTENER POR ID — con info de seguridad y eliminador
  // ═══════════════════════════════════════════════
  async findById(id: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      include: {
        rol: {
          select: {
            id: true,
            nombre: true,
            descripcion: true,
            permisos: true,
            nivel_jerarquico: true,
          },
        },
        eliminador: {
          select: { id: true, nombres: true, apellido_paterno: true },
        },
      },
    });

    if (!usuario) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    }

    return this.mapToResponseDetailed(usuario);
  }

  // ═══════════════════════════════════════════════
  // OBTENER POR EMAIL
  // ═══════════════════════════════════════════════
  async findByEmail(email: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { email },
      include: { rol: true },
    });
    return usuario ? this.mapToResponse(usuario) : null;
  }

  // ═══════════════════════════════════════════════
  // CREAR USUARIO
  // ═══════════════════════════════════════════════
  async createUser(createUserDto: CreateUserDto & { ci?: string }) {
    // Validar email único
    const emailExiste = await this.prisma.usuario.findUnique({
      where: { email: createUserDto.email },
    });
    if (emailExiste) {
      throw new ConflictException('El email ya está registrado');
    }

    // Validar CI único si viene
    if (createUserDto.ci) {
      const ciExiste = await this.prisma.usuario.findFirst({
        where: { ci: createUserDto.ci },
      });
      if (ciExiste) {
        throw new ConflictException('El CI ya está registrado');
      }
    }

    // Validar rol existe
    if (!createUserDto.rol_id) {
      throw new BadRequestException('El rol es obligatorio');
    }
    const rol = await this.prisma.role.findUnique({
      where: { id: createUserDto.rol_id },
    });
    if (!rol) {
      throw new BadRequestException('Rol no válido');
    }

    // Si no viene password, generar una temporal
    let passwordPlain = createUserDto.password;
    let esTemporal = false;
    if (!passwordPlain || passwordPlain.length < 6) {
      passwordPlain = this.generarPasswordTemporal();
      esTemporal = true;
    }

    const hash = await bcrypt.hash(passwordPlain, 10);

    const data: any = {
      email: createUserDto.email,
      password_hash: hash,
      nombres: createUserDto.nombres,
      apellido_paterno: createUserDto.apellido_paterno,
      apellido_materno: createUserDto.apellido_materno || null,
      telefono: createUserDto.telefono || null,
      ci: createUserDto.ci || null,
      rol_id: createUserDto.rol_id,
      estado: true,
      password_temporal: esTemporal,
      requiere_cambio_password: esTemporal,
    };

    // Campos opcionales adicionales
    if ((createUserDto as any).fecha_contratacion) {
      data.fecha_contratacion = new Date(
        (createUserDto as any).fecha_contratacion,
      );
    }
    if ((createUserDto as any).numero_empleado) {
      data.numero_empleado = (createUserDto as any).numero_empleado;
    }
    if ((createUserDto as any).salario_base !== undefined) {
      data.salario_base = Number((createUserDto as any).salario_base);
    }
    if ((createUserDto as any).comision_porcentaje !== undefined) {
      data.comision_porcentaje = Number(
        (createUserDto as any).comision_porcentaje,
      );
    }

    const usuario = await this.prisma.usuario.create({
      data,
      include: { rol: true },
    });

    this.logger.log(`Usuario creado: ${usuario.email}`);

    // Devolver con password temporal si aplica
    return {
      ...this.mapToResponse(usuario),
      password_temporal_generada: esTemporal ? passwordPlain : undefined,
    };
  }

  // ═══════════════════════════════════════════════
  // ACTUALIZAR — con whitelist limpia
  // ═══════════════════════════════════════════════
  async update(
    id: number,
    dto: any,
    rolUsuarioActual: string,
    idUsuarioActual: number,
  ) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      include: { rol: true },
    });
    if (!usuario) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    }
    if (usuario.deleted_at) {
      throw new BadRequestException('No se puede editar un usuario eliminado');
    }

    // Permisos: ADMIN no puede editar a SUPER_ADMIN
    if (rolUsuarioActual === 'ADMIN' && usuario.rol?.nombre === 'SUPER_ADMIN') {
      throw new ForbiddenException(
        'No tienes permiso para editar a un SUPER_ADMIN',
      );
    }

    // Validar email único si cambia
    if (dto.email && dto.email !== usuario.email) {
      const emailExiste = await this.prisma.usuario.findUnique({
        where: { email: dto.email },
      });
      if (emailExiste) {
        throw new ConflictException('El email ya está registrado');
      }
    }

    // Validar CI único si cambia
    if (dto.ci && dto.ci !== usuario.ci) {
      const ciExiste = await this.prisma.usuario.findFirst({
        where: { ci: dto.ci, NOT: { id } },
      });
      if (ciExiste) {
        throw new ConflictException('El CI ya está registrado');
      }
    }

    const camposString = [
      'nombres',
      'apellido_paterno',
      'apellido_materno',
      'email',
      'telefono',
      'ci',
      'numero_empleado',
      'avatar_url',
    ];
    const camposNumeric = ['rol_id', 'salario_base', 'comision_porcentaje'];
    const camposBool = ['estado'];
    const camposDate = ['fecha_contratacion'];

    const data: any = {};

    for (const k of camposString) {
      if (dto[k] !== undefined) {
        data[k] = dto[k] === '' ? null : dto[k];
      }
    }
    for (const k of camposNumeric) {
      if (dto[k] !== undefined && dto[k] !== null && dto[k] !== '') {
        data[k] = Number(dto[k]);
      } else if (dto[k] === null || dto[k] === '') {
        data[k] = null;
      }
    }
    for (const k of camposBool) {
      if (dto[k] !== undefined) {
        data[k] = toBool(dto[k]);
      }
    }
    for (const k of camposDate) {
      if (dto[k] !== undefined && dto[k] !== null && dto[k] !== '') {
        data[k] = new Date(dto[k]);
      } else if (dto[k] === null || dto[k] === '') {
        data[k] = null;
      }
    }

    // Protección: ADMIN no puede asignar SUPER_ADMIN
    if (data.rol_id && rolUsuarioActual === 'ADMIN') {
      const nuevoRol = await this.prisma.role.findUnique({
        where: { id: data.rol_id },
      });
      if (nuevoRol?.nombre === 'SUPER_ADMIN') {
        throw new ForbiddenException(
          'Solo SUPER_ADMIN puede asignar rol SUPER_ADMIN',
        );
      }
    }

    try {
      const updated = await this.prisma.usuario.update({
        where: { id },
        data,
        include: { rol: true },
      });
      this.logger.log(`Usuario actualizado: ${updated.email}`);
      return this.mapToResponse(updated);
    } catch (e: any) {
      if (e.code === 'P2002') {
        throw new ConflictException(
          'Email, CI o número de empleado ya registrado',
        );
      }
      throw e;
    }
  }

  // ═══════════════════════════════════════════════
  // ACTIVAR/DESACTIVAR
  // ═══════════════════════════════════════════════
  async toggleActive(
    id: number,
    estado: boolean,
    rolActual: string,
    idActual: number,
  ) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      include: { rol: true },
    });
    if (!usuario) throw new NotFoundException(`Usuario ${id} no encontrado`);

    if (usuario.deleted_at) {
      throw new BadRequestException(
        'No se puede cambiar el estado de un usuario eliminado. Restáuralo primero.',
      );
    }

    if (rolActual === 'ADMIN' && usuario.rol?.nombre === 'SUPER_ADMIN') {
      throw new ForbiddenException(
        'No puedes cambiar estado de un SUPER_ADMIN',
      );
    }

    if (id === idActual && estado === false) {
      throw new BadRequestException('No puedes desactivarte a ti mismo');
    }

    const updated = await this.prisma.usuario.update({
      where: { id },
      data: { estado },
      include: { rol: true },
    });

    this.logger.log(
      `Usuario ${updated.email} ${estado ? 'activado' : 'desactivado'} por usuario ${idActual}`,
    );

    return this.mapToResponse(updated);
  }

  // ═══════════════════════════════════════════════
  // CAMBIAR ROL (solo SUPER_ADMIN)
  // ═══════════════════════════════════════════════
  async changeRole(userId: number, rolId: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: userId },
      include: { rol: true },
    });
    if (!usuario)
      throw new NotFoundException(`Usuario ${userId} no encontrado`);

    const rol = await this.prisma.role.findUnique({ where: { id: rolId } });
    if (!rol) throw new BadRequestException(`Rol ${rolId} no existe`);

    const updated = await this.prisma.usuario.update({
      where: { id: userId },
      data: { rol_id: rolId },
      include: { rol: true },
    });
    return this.mapToResponse(updated);
  }

  // ═══════════════════════════════════════════════
  // RESETEAR PASSWORD — genera temporal
  // ═══════════════════════════════════════════════
  async resetPassword(id: number, rolActual: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      include: { rol: true },
    });
    if (!usuario) throw new NotFoundException(`Usuario ${id} no encontrado`);

    if (rolActual === 'ADMIN' && usuario.rol?.nombre === 'SUPER_ADMIN') {
      throw new ForbiddenException(
        'No puedes resetear el password de un SUPER_ADMIN',
      );
    }

    if (usuario.deleted_at) {
      throw new BadRequestException(
        'No se puede resetear password de un usuario eliminado',
      );
    }

    const passwordTemporal = this.generarPasswordTemporal();
    const hash = await bcrypt.hash(passwordTemporal, 10);

    await this.prisma.usuario.update({
      where: { id },
      data: {
        password_hash: hash,
        password_temporal: true,
        requiere_cambio_password: true,
        intentos_fallidos_login: 0,
        bloqueado_hasta: null,
      },
    });

    this.logger.log(`Password reseteada para usuario ${usuario.email}`);

    return {
      mensaje: 'Password reseteada correctamente',
      password_temporal: passwordTemporal,
      email: usuario.email,
    };
  }

  // ═══════════════════════════════════════════════
  // ELIMINAR (SOFT DELETE)
  // ═══════════════════════════════════════════════
  async softDelete(
    id: number,
    motivo: string,
    usuarioActualId: number,
    rolActual: string,
  ) {
    if (rolActual !== 'SUPER_ADMIN') {
      throw new ForbiddenException(
        'Solo SUPER_ADMIN puede eliminar usuarios definitivamente',
      );
    }

    if (!motivo || motivo.trim().length < 3) {
      throw new BadRequestException(
        'El motivo es obligatorio (mínimo 3 caracteres)',
      );
    }

    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      include: { rol: true },
    });
    if (!usuario) throw new NotFoundException(`Usuario ${id} no encontrado`);

    if (usuario.deleted_at) {
      throw new BadRequestException('El usuario ya está eliminado');
    }

    // ✅ NUEVA REGLA: debe estar inactivo antes de eliminar
    if (usuario.estado === true) {
      throw new BadRequestException(
        'El usuario debe estar Inactivo antes de eliminarlo. Desactívalo primero.',
      );
    }

    // Protecciones de seguridad
    if (usuario.rol?.nombre === 'SUPER_ADMIN') {
      throw new BadRequestException('No se puede eliminar a un SUPER_ADMIN');
    }
    if (id === usuarioActualId) {
      throw new BadRequestException('No puedes eliminarte a ti mismo');
    }

    this.logger.log(
      `Usuario ${usuario.email} eliminado por usuario ${usuarioActualId}`,
    );

    return this.prisma.usuario.update({
      where: { id },
      data: {
        deleted_at: new Date(),
        deleted_by: usuarioActualId,
        motivo_eliminacion: motivo.trim(),
        // estado: false ya estaba
      },
    });
  }

  // ═══════════════════════════════════════════════
  // RESTAURAR (solo SUPER_ADMIN)
  // ═══════════════════════════════════════════════
  async restore(id: number, rolActual: string) {
    if (rolActual !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Solo SUPER_ADMIN puede restaurar usuarios');
    }

    const usuario = await this.prisma.usuario.findUnique({ where: { id } });
    if (!usuario) throw new NotFoundException(`Usuario ${id} no encontrado`);
    if (!usuario.deleted_at) {
      throw new BadRequestException('El usuario no está eliminado');
    }

    return this.prisma.usuario.update({
      where: { id },
      data: {
        deleted_at: null,
        deleted_by: null,
        motivo_eliminacion: null,
        estado: false,
      },
    });
  }

  // ═══════════════════════════════════════════════
  // STATS
  // ═══════════════════════════════════════════════
  async getStatistics() {
    const where = { deleted_at: null };

    const [total, activos, inactivos] = await Promise.all([
      this.prisma.usuario.count({ where }),
      this.prisma.usuario.count({ where: { ...where, estado: true } }),
      this.prisma.usuario.count({ where: { ...where, estado: false } }),
    ]);

    // Por rol
    const roles = await this.prisma.role.findMany({
      where: { activo: true },
      orderBy: { nivel_jerarquico: 'desc' },
    });

    const porRol: Record<string, number> = {};
    for (const r of roles) {
      const count = await this.prisma.usuario.count({
        where: { ...where, rol_id: r.id },
      });
      porRol[r.nombre] = count;
    }

    return {
      total,
      activos,
      inactivos,
      por_rol: porRol,
    };
  }

  // ═══════════════════════════════════════════════
  // LISTAR ROLES (para dropdowns del frontend)
  // ═══════════════════════════════════════════════
  async listRoles() {
    return this.prisma.role.findMany({
      where: { activo: true },
      orderBy: { nivel_jerarquico: 'desc' },
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        nivel_jerarquico: true,
      },
    });
  }

  // ═══════════════════════════════════════════════
  // REPARTIDORES (mantener compatibilidad)
  // ═══════════════════════════════════════════════
  async getRepartidores() {
    return this.prisma.usuario.findMany({
      where: {
        estado: true,
        deleted_at: null,
        rol: { nombre: 'REPARTIDOR' },
      },
      select: {
        id: true,
        nombres: true,
        apellido_paterno: true,
        apellido_materno: true,
        telefono: true,
      },
      orderBy: { nombres: 'asc' },
    });
  }

  // ═══════════════════════════════════════════════
  // CREAR ADMIN (mantener compatibilidad)
  // ═══════════════════════════════════════════════
  async createAdmin(dto: CreateUserDto & { ci?: string }) {
    const rolAdmin = await this.prisma.role.findUnique({
      where: { nombre: 'ADMIN' },
    });
    if (!rolAdmin) {
      throw new BadRequestException('El rol ADMIN no existe en el sistema');
    }
    return this.createUser({ ...dto, rol_id: rolAdmin.id });
  }

  // ═══════════════════════════════════════════════
  // findByRole (mantener compatibilidad)
  // ═══════════════════════════════════════════════
  async findByRole(rolNombre: string) {
    const usuarios = await this.prisma.usuario.findMany({
      where: {
        deleted_at: null,
        rol: { nombre: rolNombre },
        estado: true,
      },
      include: { rol: true },
    });
    return usuarios.map((u) => this.mapToResponse(u));
  }

  // ═══════════════════════════════════════════════
  // DELETE legacy (lo dejamos por compatibilidad pero llama a softDelete)
  // ═══════════════════════════════════════════════
  async delete(id: number) {
    return { mensaje: 'Use el endpoint DELETE con motivo en el body' };
  }

  // ═══════════════════════════════════════════════
  // MAPPERS
  // ═══════════════════════════════════════════════
  private mapToResponse(usuario: any) {
    return {
      id: usuario.id,
      nombres: usuario.nombres,
      apellido_paterno: usuario.apellido_paterno,
      apellido_materno: usuario.apellido_materno,
      email: usuario.email,
      ci: usuario.ci,
      telefono: usuario.telefono,
      avatar_url: usuario.avatar_url,
      numero_empleado: usuario.numero_empleado,
      fecha_contratacion: usuario.fecha_contratacion,
      salario_base: usuario.salario_base ? Number(usuario.salario_base) : null,
      comision_porcentaje: usuario.comision_porcentaje
        ? Number(usuario.comision_porcentaje)
        : null,
      estado: usuario.estado,
      rol: usuario.rol,
      rol_id: usuario.rol_id,
      deleted_at: usuario.deleted_at,
      created_at: usuario.created_at,
    };
  }

  private mapToResponseDetailed(usuario: any) {
    return {
      ...this.mapToResponse(usuario),
      // Info de seguridad
      ultimo_acceso: usuario.ultimo_acceso,
      ultima_ip: usuario.ultima_ip,
      intentos_fallidos_login: usuario.intentos_fallidos_login,
      bloqueado_hasta: usuario.bloqueado_hasta,
      password_temporal: usuario.password_temporal,
      requiere_cambio_password: usuario.requiere_cambio_password,
      // Soft delete
      deleted_by: usuario.deleted_by,
      motivo_eliminacion: usuario.motivo_eliminacion,
      eliminador: usuario.eliminador,
    };
  }
}
