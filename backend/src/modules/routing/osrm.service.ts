import { Injectable, Logger, BadRequestException } from '@nestjs/common';
 
export interface LatLng { lat: number; lng: number; }
 
export interface RutaOptimizada {
  /** Orden óptimo de visita (índices en el array original) */
  orden: number[];
  /** Distancia total en metros */
  distancia_metros: number;
  /** Tiempo total estimado en segundos */
  duracion_segundos: number;
  /** Geometría GeoJSON de la ruta completa (para dibujar en Leaflet) */
  geometria: {
    type: 'LineString';
    coordinates: [number, number][];  // [lng, lat][]
  };
  /** Distancia formateada legible */
  distancia_texto: string;
  /** Tiempo formateado legible */
  duracion_texto: string;
}
 
@Injectable()
export class OsrmService {
  private readonly logger = new Logger(OsrmService.name);
 
  // URL del servidor OSRM. Configurable por variable de entorno
  // Por defecto usa localhost (cuando OSRM corre en la misma máquina)
  private readonly OSRM_URL =
    process.env.OSRM_URL ?? 'http://localhost:5000';
 
  // ── OPTIMIZAR RUTA (TSP) ───────────────────────────────────
  // Toma N puntos y los reordena en la mejor secuencia para
  // visitar todos minimizando distancia/tiempo total.
  // El primer punto siempre es el origen (repartidor).
  async optimizarRuta(origen: LatLng, paradas: LatLng[]): Promise<RutaOptimizada> {
    if (!paradas.length) {
      throw new BadRequestException('Sin paradas para optimizar');
    }
 
    // OSRM espera coordenadas en formato lon,lat (NO lat,lon)
    const puntos = [origen, ...paradas]
      .map(p => `${p.lng},${p.lat}`)
      .join(';');
 
    // /trip = endpoint de optimización (Traveling Salesman Problem)
    // source=first  → comenzar desde el primer punto (el repartidor)
    // roundtrip=false → no obligar a regresar al origen
    // overview=full + geometries=geojson → devolver geometría para dibujar
    const url = `${this.OSRM_URL}/trip/v1/driving/${puntos}` +
      `?source=first&roundtrip=false&overview=full&geometries=geojson`;
 
    try {
      const res = await fetch(url);
      if (!res.ok) {
        const err = await res.text();
        throw new BadRequestException(`OSRM error: ${err}`);
      }
 
      const data: any = await res.json();
 
      if (data.code !== 'Ok' || !data.trips?.length) {
        throw new BadRequestException(`OSRM no pudo calcular la ruta: ${data.code}`);
      }
 
      const trip = data.trips[0];
 
      // waypoints[i].waypoint_index → en qué orden se visita
      // Excluimos el primer punto (origen del repartidor)
      const orden: number[] = data.waypoints
        .slice(1)                            // quitar origen
        .map((w: any, i: number) => ({
          input_idx:    i,                   // índice en el array de paradas original
          output_order: w.waypoint_index,    // posición en la ruta óptima
        }))
        .sort((a: any, b: any) => a.output_order - b.output_order)
        .map((x: any) => x.input_idx);
 
      return {
        orden,
        distancia_metros:  trip.distance,
        duracion_segundos: trip.duration,
        geometria:         trip.geometry,
        distancia_texto:   this.formatearDistancia(trip.distance),
        duracion_texto:    this.formatearDuracion(trip.duration),
      };
    } catch (e) {
      if (e instanceof Error) {
        this.logger.error(`optimizarRuta: ${e.message}`);
        if (e.message.includes('fetch failed') || e.message.includes('ECONNREFUSED')) {
          throw new BadRequestException(
            'No se puede conectar al servidor OSRM. ¿Está corriendo en ' + this.OSRM_URL + '?'
          );
        }
      }
      throw e;
    }
  }
 
  // ── CALCULAR RUTA SIMPLE entre 2 puntos ────────────────────
  // No optimiza, solo dibuja la línea entre origen y destino
  async rutaSimple(origen: LatLng, destino: LatLng): Promise<{
    distancia_metros: number;
    duracion_segundos: number;
    geometria: { type: 'LineString'; coordinates: [number, number][] };
    distancia_texto: string;
    duracion_texto: string;
  }> {
    const url = `${this.OSRM_URL}/route/v1/driving/` +
      `${origen.lng},${origen.lat};${destino.lng},${destino.lat}` +
      `?overview=full&geometries=geojson`;
 
    const res = await fetch(url);
    if (!res.ok) throw new BadRequestException('OSRM error');
 
    const data: any = await res.json();
    if (data.code !== 'Ok') {
      throw new BadRequestException(`Ruta no encontrada: ${data.code}`);
    }
 
    const route = data.routes[0];
    return {
      distancia_metros:  route.distance,
      duracion_segundos: route.duration,
      geometria:         route.geometry,
      distancia_texto:   this.formatearDistancia(route.distance),
      duracion_texto:    this.formatearDuracion(route.duration),
    };
  }
 
  // ── Helpers de formato ────────────────────────────────────
  private formatearDistancia(metros: number): string {
    if (metros < 1000) return `${Math.round(metros)} m`;
    return `${(metros / 1000).toFixed(1)} km`;
  }
 
  private formatearDuracion(segundos: number): string {
    const totalMin = Math.round(segundos / 60);
    if (totalMin < 60) return `${totalMin} min`;
    const horas = Math.floor(totalMin / 60);
    const min   = totalMin % 60;
    return `${horas}h ${min}min`;
  }
}