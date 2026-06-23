import {
  Injectable, NotFoundException, BadRequestException,
  UnauthorizedException, Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt       from 'bcrypt';
import { unlink }        from 'fs/promises';
import { join }          from 'path';
 
@Injectable()
export class PerfilService {
  private readonly logger = new Logger(PerfilService.name);
 
  constructor(private prisma: PrismaService) {}
 
  // ── Obtener perfil del usuario logueado ────────────────────
  async getMi(usuarioId: number) {
    const u = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: {
        id: true,
        nombres: true,
        apellido_paterno: true,
        apellido_materno: true,
        email: true,
        telefono: true,
        avatar_url: true,
        numero_empleado: true,
        fecha_contratacion: true,
        created_at: true,
        rol: { select: { id: true, nombre: true } },
      },
    });
    if (!u) throw new NotFoundException('Usuario no encontrado');
    return u;
  }
 
  // ── Actualizar datos personales ────────────────────────────
  async actualizarDatos(
    usuarioId: number,
    dto: {
      nombres?:          string;
      apellido_paterno?: string;
      apellido_materno?: string;
      telefono?:         string;
      email?:            string;
    },
  ) {
    // Validar email único si lo cambia
    if (dto.email) {
      const existente = await this.prisma.usuario.findFirst({
        where: { email: dto.email, NOT: { id: usuarioId } },
      });
      if (existente) {
        throw new BadRequestException('Ese correo ya está en uso por otro usuario');
      }
    }
 
    const actualizado = await this.prisma.usuario.update({
      where: { id: usuarioId },
      data: {
        nombres:          dto.nombres          || undefined,
        apellido_paterno: dto.apellido_paterno || undefined,
        apellido_materno: dto.apellido_materno || undefined,
        telefono:         dto.telefono         || undefined,
        email:            dto.email            || undefined,
      },
      select: {
        id: true, nombres: true,
        apellido_paterno: true, apellido_materno: true,
        email: true, telefono: true, avatar_url: true,
        rol: { select: { id: true, nombre: true } },
      },
    });
 
    await this.auditar(usuarioId, 'EDITAR_PERFIL', { campos: Object.keys(dto) });
    this.logger.log(`Usuario ${usuarioId} actualizó su perfil`);
    return actualizado;
  }
 
  // ── Cambiar contraseña ─────────────────────────────────────
  async cambiarPassword(
    usuarioId: number,
    dto: { actual: string; nueva: string },
  ) {
    if (!dto.actual || !dto.nueva) {
      throw new BadRequestException('Contraseña actual y nueva son obligatorias');
    }
    if (dto.nueva.length < 8) {
      throw new BadRequestException('La nueva contraseña debe tener al menos 8 caracteres');
    }
    if (dto.actual === dto.nueva) {
      throw new BadRequestException('La nueva contraseña debe ser diferente a la actual');
    }
 
    const usuario = await this.prisma.usuario.findUnique({
      where:  { id: usuarioId },
      select: { id: true, password_hash: true },
    });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
 
    const ok = await bcrypt.compare(dto.actual, usuario.password_hash);
    if (!ok) throw new UnauthorizedException('La contraseña actual es incorrecta');
 
    const hash = await bcrypt.hash(dto.nueva, 10);
    await this.prisma.usuario.update({
      where: { id: usuarioId },
      data:  { password_hash: hash, refresh_token: null },     // invalidar sesiones
    });
 
    await this.auditar(usuarioId, 'CAMBIAR_PASSWORD', {});
    this.logger.log(`Usuario ${usuarioId} cambió su contraseña`);
    return { mensaje: 'Contraseña actualizada. Tu sesión sigue activa.' };
  }
 
  // ── Actualizar foto de perfil ──────────────────────────────
  async actualizarAvatar(usuarioId: number, archivo: Express.Multer.File) {
    if (!archivo) throw new BadRequestException('No se recibió ningún archivo');
 
    // Eliminar foto anterior si existe
    const actual = await this.prisma.usuario.findUnique({
      where:  { id: usuarioId },
      select: { avatar_url: true },
    });
 
    if (actual?.avatar_url) {
      const oldPath = join(process.cwd(), actual.avatar_url.replace(/^\//, ''));
      try { await unlink(oldPath); } catch { /* no existe, ignorar */ }
    }
 
    // URL pública relativa (servida por el endpoint estático)
    const url = `/uploads/avatars/${archivo.filename}`;
 
    const actualizado = await this.prisma.usuario.update({
      where: { id: usuarioId },
      data:  { avatar_url: url },
      select: {
        id: true, nombres: true,
        apellido_paterno: true, apellido_materno: true,
        email: true, telefono: true, avatar_url: true,
      },
    });
 
    await this.auditar(usuarioId, 'CAMBIAR_AVATAR', { url });
    this.logger.log(`Usuario ${usuarioId} actualizó su foto: ${url}`);
    return actualizado;
  }
 
  // ── Eliminar foto de perfil ────────────────────────────────
  async eliminarAvatar(usuarioId: number) {
    const actual = await this.prisma.usuario.findUnique({
      where:  { id: usuarioId },
      select: { avatar_url: true },
    });
 
    if (actual?.avatar_url) {
      const oldPath = join(process.cwd(), actual.avatar_url.replace(/^\//, ''));
      try { await unlink(oldPath); } catch { /* ignorar */ }
    }
 
    await this.prisma.usuario.update({
      where: { id: usuarioId },
      data:  { avatar_url: null },
    });
 
    await this.auditar(usuarioId, 'ELIMINAR_AVATAR', {});
    return { mensaje: 'Foto de perfil eliminada' };
  }
 
  // ── Cerrar todas las sesiones (logout global) ──────────────
  async cerrarTodasLasSesiones(usuarioId: number) {
    await this.prisma.usuario.update({
      where: { id: usuarioId },
      data:  { refresh_token: null },
    });
 
    await this.auditar(usuarioId, 'CERRAR_TODAS_SESIONES', {});
    return { mensaje: 'Sesiones cerradas. Vuelve a iniciar sesión.' };
  }
 
  // ── Helper de auditoría ────────────────────────────────────
  private async auditar(usuarioId: number, accion: string, datos: object) {
    try {
      await this.prisma.auditoriaLog.create({
        data: {
          accion,
          modulo:         'PERFIL',
          tabla_afectada: 'usuarios',
          registro_id:    String(usuarioId),
          valor_nuevo:    datos as any,
          ip_origen:      '127.0.0.1',
          usuario: { connect: { id: usuarioId } },
        },
      });
    } catch (e) {
      this.logger.warn(`Auditoría no registrada: ${e}`);
    }
  }
}