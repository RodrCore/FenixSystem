import {
  Controller, Get, Patch, Post, Delete,
  Body, UseGuards, UseInterceptors, UploadedFile, Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard }    from '../auth/guards/jwt-auth.guard';
import { PerfilService }   from './perfil.service';
 
@Controller('perfil')
@UseGuards(JwtAuthGuard)
export class PerfilController {
  constructor(private perfilService: PerfilService) {}
 
  // GET /api/perfil — datos del usuario logueado
  @Get()
  getMi(@Request() req: any) {
    return this.perfilService.getMi(req.user.id);
  }
 
  // PATCH /api/perfil — actualizar datos personales
  @Patch()
  actualizar(@Request() req: any, @Body() dto: any) {
    return this.perfilService.actualizarDatos(req.user.id, dto);
  }
 
  // POST /api/perfil/password — cambiar contraseña
  @Post('password')
  cambiarPassword(@Request() req: any, @Body() dto: any) {
    return this.perfilService.cambiarPassword(req.user.id, dto);
  }
 
  // POST /api/perfil/avatar — subir foto (multipart/form-data)
  @Post('avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  subirAvatar(
    @Request() req: any,
    @UploadedFile() archivo: Express.Multer.File,
  ) {
    return this.perfilService.actualizarAvatar(req.user.id, archivo);
  }
 
  // DELETE /api/perfil/avatar — eliminar foto
  @Delete('avatar')
  eliminarAvatar(@Request() req: any) {
    return this.perfilService.eliminarAvatar(req.user.id);
  }
 
  // POST /api/perfil/cerrar-sesiones — invalidar todos los tokens
  @Post('cerrar-sesiones')
  cerrarSesiones(@Request() req: any) {
    return this.perfilService.cerrarTodasLasSesiones(req.user.id);
  }
}