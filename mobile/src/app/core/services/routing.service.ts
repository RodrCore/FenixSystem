import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
 
export interface LatLng { lat: number; lng: number; }
 
export interface RutaOptimizada {
  /** Orden óptimo: array con los índices de las paradas reordenados */
  orden:             number[];
  distancia_metros:  number;
  duracion_segundos: number;
  geometria: {
    type:        'LineString';
    coordinates: [number, number][];   // [lng, lat][]
  };
  distancia_texto: string;
  duracion_texto:  string;
}
 
@Injectable({ providedIn: 'root' })
export class RoutingService {
  private api = environment.apiUrl;
 
  constructor(private http: HttpClient) {}
 
  /**
   * Optimiza el orden de visita de N paradas desde un origen.
   * El backend usa OSRM internamente.
   */
  optimizarRuta(origen: LatLng, paradas: LatLng[]): Observable<RutaOptimizada> {
    return this.http.post<RutaOptimizada>(`${this.api}/routing/optimizar`, {
      origen,
      paradas,
    });
  }
 
  /**
   * Calcula la ruta entre 2 puntos sin optimizar.
   * Útil para mostrar la línea hacia el próximo cliente.
   */
  rutaSimple(origen: LatLng, destino: LatLng): Observable<RutaOptimizada> {
    return this.http.post<RutaOptimizada>(`${this.api}/routing/ruta`, {
      origen,
      destino,
    });
  }
}