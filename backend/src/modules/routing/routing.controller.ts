import {
  Controller, Post, Body, UseGuards, BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OsrmService, LatLng } from './osrm.service';
 
@Controller('routing')
@UseGuards(JwtAuthGuard)
export class RoutingController {
  constructor(private osrm: OsrmService) {}
 
  // POST /api/routing/optimizar
  // Body: { origen: { lat, lng }, paradas: [{ lat, lng }, ...] }
  @Post('optimizar')
  optimizar(@Body() dto: { origen: LatLng; paradas: LatLng[] }) {
    if (!dto.origen?.lat || !dto.origen?.lng) {
      throw new BadRequestException('Origen inválido');
    }
    if (!Array.isArray(dto.paradas) || dto.paradas.length === 0) {
      throw new BadRequestException('Paradas requeridas');
    }
    return this.osrm.optimizarRuta(dto.origen, dto.paradas);
  }
 
  // POST /api/routing/ruta
  // Body: { origen: { lat, lng }, destino: { lat, lng } }
  @Post('ruta')
  ruta(@Body() dto: { origen: LatLng; destino: LatLng }) {
    return this.osrm.rutaSimple(dto.origen, dto.destino);
  }
}