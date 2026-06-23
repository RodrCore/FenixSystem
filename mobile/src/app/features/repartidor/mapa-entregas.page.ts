// ═══════════════════════════════════════════════════════════════
// mobile/src/app/features/repartidor/mapa-entregas.page.ts
//
// Mapa con tracking en tiempo real:
// - Marcador minibus que sigue al repartidor
// - Auto-seguimiento del mapa
// - ✅ Recálculo automático de ruta si el repartidor se desvía
// - ✅ Marcadores siempre visibles ENCIMA de la polyline
// ═══════════════════════════════════════════════════════════════

import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent,
  AlertController,
  ToastController,
  LoadingController,
} from '@ionic/angular/standalone';
import { Subject, takeUntil, Subscription, firstValueFrom } from 'rxjs';
import { VentasService } from '../../core/services/ventas.service';
import { RoutingService } from '../../core/services/routing.service';
import {
  TrackingService,
  UbicacionActualizada,
} from '../../core/services/tracking.service';
import { Pedido } from '../../core/models/venta.model';
import { NavbarComponent } from '../../shared/components/navbar/navbar';

declare const L: any;

// ── CONFIGURACIÓN DE RECÁLCULO ───────────────────────────
const METROS_DESVIO_PARA_RECALCULAR = 80; // si te desvías >80m, recalcular
const SEGUNDOS_ENTRE_RECALCULOS = 30; // mínimo 30s entre recálculos

@Component({
  selector: 'app-mapa-entregas',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, IonContent, NavbarComponent],
  templateUrl: './mapa-entregas.page.html',
  styleUrl: './mapa-entregas.page.scss',
})
export class MapaEntregasPage implements OnInit, AfterViewInit, OnDestroy {
  entregas: Pedido[] = [];
  loading = true;
  rutaActiva = false;
  rutaInfo: { distancia: string; duracion: string } | null = null;

  private map: any = null;
  private markers: any[] = [];
  private rutaLayer: any = null;
  private miMarker: any = null;

  /** Coordenadas de la ruta actual para calcular desviaciones */
  private coordenadasRuta: [number, number][] = [];
  /** Timestamp del último recálculo para no spamear OSRM */
  private ultimoRecalculo = 0;
  /** Flag para evitar recálculos simultáneos */
  private recalculando = false;

  seguirMiUbicacion = true;
  mostrarBotonSeguir = false;

  private destroy$ = new Subject<void>();
  private subRuta?: Subscription;

  constructor(
    private ventas: VentasService,
    private routing: RoutingService,
    private router: Router,
    private toast: ToastController,
    private loader: LoadingController,
    private alert: AlertController,
    private zone: NgZone,
    private cdr: ChangeDetectorRef,
    private tracking: TrackingService
  ) {}

  // ════════════════════════════════════════════════════════
  ngOnInit(): void {
    this.ventas
      .getMisEntregas()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (pedidos) => {
          this.entregas = pedidos.filter((p) => {
            const lat = Number(p.cliente?.latitud);
            const lng = Number(p.cliente?.longitud);
            return lat && lng;
          });
          this.loading = false;
          this.dibujarMarcadores();
          this.cdr.markForCheck();
        },
        error: () => {
          this.loading = false;
          this.cdr.markForCheck();
        },
      });

    this.subRuta = this.tracking.rutaActiva$.subscribe((activa) => {
      this.rutaActiva = activa;
      this.cdr.markForCheck();
    });

    // ✅ Cada actualización GPS: mover marcador + verificar desvío
    this.tracking.miUbicacion$
      .pipe(takeUntil(this.destroy$))
      .subscribe((ubicacion) => {
        this.zone.run(() => {
          this.actualizarMiMarker(ubicacion);
          this.verificarDesvioYRecalcular(ubicacion);
        });
      });
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.inicializarMapa(), 200);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.map?.remove();
    this.subRuta?.unsubscribe();
  }

  // ════════════════════════════════════════════════════════
  // INICIALIZAR MAPA
  // ════════════════════════════════════════════════════════
  private inicializarMapa(): void {
    if (typeof L === 'undefined') {
      console.error('Leaflet no está cargado');
      return;
    }

    this.map = L.map('mapa-entregas', {
      center: [-19.5836, -65.7531],
      zoom: 13,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap',
    }).addTo(this.map);

    L.control.zoom({ position: 'bottomright' }).addTo(this.map);

    this.map.on('dragstart', () => {
      if (this.seguirMiUbicacion && this.rutaActiva) {
        this.zone.run(() => {
          this.seguirMiUbicacion = false;
          this.mostrarBotonSeguir = true;
          this.cdr.markForCheck();
        });
      }
    });

    this.dibujarMarcadores();
  }

  // ════════════════════════════════════════════════════════
  // MARCADORES DE CLIENTES (siempre encima de la polyline)
  // ════════════════════════════════════════════════════════
  private dibujarMarcadores(): void {
    if (!this.map || !this.entregas.length) return;

    this.markers.forEach((m) => m.remove());
    this.markers = [];

    this.entregas.forEach((p, i) => {
      const lat = Number(p.cliente?.latitud);
      const lng = Number(p.cliente?.longitud);

      const icon = L.divIcon({
        html: `<div class="num-marker"><span>${i + 1}</span></div>`,
        className: 'custom-marker-wrapper',
        iconSize: [34, 42],
        iconAnchor: [17, 42],
        popupAnchor: [0, -38],
      });

      // ✅ zIndexOffset alto para que SIEMPRE quede encima de la polyline
      const marker = L.marker([lat, lng], {
        icon,
        zIndexOffset: 500,
      }).addTo(this.map);

      marker.bindPopup(`
        <strong>${p.cliente?.razon_social}</strong><br/>
        Bs ${Number(p.total).toFixed(2)}
      `);
      this.markers.push(marker);
    });

    if (this.markers.length > 0 && !this.rutaActiva) {
      const group = L.featureGroup(this.markers);
      this.map.fitBounds(group.getBounds().pad(0.2));
    }
  }

  // ════════════════════════════════════════════════════════
  // MARCADOR "YO" (TIEMPO REAL)
  // ════════════════════════════════════════════════════════
  private actualizarMiMarker(ubicacion: UbicacionActualizada): void {
    if (!this.map || typeof L === 'undefined') return;

    const latlng: [number, number] = [ubicacion.lat, ubicacion.lng];

    if (this.miMarker) {
      this.miMarker.setLatLng(latlng);
    } else {
      const icon = L.divIcon({
        html: `<div style="
          width: 42px; height: 42px;
          display: flex; align-items: center; justify-content: center;
          filter: drop-shadow(0 3px 5px rgba(0,0,0,0.40));
        ">
          <svg width="40" height="40" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="32" cy="58" rx="16" ry="2.5" fill="rgba(0,0,0,0.20)"/>
            <rect x="14" y="8" width="36" height="48" rx="8" fill="#E11D48"/>
            <rect x="14" y="8" width="36" height="14" rx="8" fill="#E11D48" opacity="0.85"/>
            <path d="M 18 18 L 46 18 L 44 26 L 20 26 Z" fill="#1e293b" opacity="0.85"/>
            <rect x="20" y="26" width="24" height="14" rx="2" fill="#E11D48" opacity="0.7"/>
            <rect x="14" y="27" width="5" height="12" rx="1" fill="#1e293b" opacity="0.75"/>
            <rect x="45" y="27" width="5" height="12" rx="1" fill="#1e293b" opacity="0.75"/>
            <path d="M 20 40 L 44 40 L 46 48 L 18 48 Z" fill="#1e293b" opacity="0.85"/>
            <circle cx="20" cy="12" r="2" fill="#fef3c7"/>
            <circle cx="44" cy="12" r="2" fill="#fef3c7"/>
            <rect x="17" y="52" width="6" height="2" rx="1" fill="#fef3c7"/>
            <rect x="41" y="52" width="6" height="2" rx="1" fill="#fef3c7"/>
          </svg>
        </div>`,
        className: '',
        iconSize: [42, 42],
        iconAnchor: [21, 21],
        popupAnchor: [0, -22],
      });

      // ✅ zIndexOffset MUY alto: encima de TODO (polyline + otros markers)
      this.miMarker = L.marker(latlng, {
        icon,
        zIndexOffset: 1000,
      }).addTo(this.map);
      this.miMarker.bindPopup('<b>Tú estás aquí</b>');
    }

    if (this.seguirMiUbicacion && this.rutaActiva) {
      this.map.panTo(latlng, { animate: true, duration: 0.5 });
    }
  }

  // ════════════════════════════════════════════════════════
  // ✅ VERIFICAR DESVÍO Y RECALCULAR RUTA
  // ════════════════════════════════════════════════════════
  private async verificarDesvioYRecalcular(
    ubicacion: UbicacionActualizada
  ): Promise<void> {
    if (!this.rutaActiva) return;
    if (this.recalculando) return;
    if (!this.coordenadasRuta.length) return;

    // Limitar frecuencia de recálculos
    const ahora = Date.now() / 1000;
    if (ahora - this.ultimoRecalculo < SEGUNDOS_ENTRE_RECALCULOS) return;

    // Calcular la distancia mínima del repartidor a la polyline
    const distanciaMinima = this.distanciaMinimaAPolyline(
      [ubicacion.lat, ubicacion.lng],
      this.coordenadasRuta
    );

    // Si está dentro del rango aceptable, no recalcular
    if (distanciaMinima < METROS_DESVIO_PARA_RECALCULAR) return;

    // Recalcular la ruta
    console.log(`[Recálculo] Desvío detectado: ${distanciaMinima.toFixed(0)}m`);
    this.recalculando = true;
    this.ultimoRecalculo = ahora;

    try {
      await this.recalcularRuta(ubicacion);
      const t = await this.toast.create({
        message: 'Ruta recalculada',
        duration: 1500,
        position: 'bottom',
        color: 'medium',
      });
      await t.present();
    } catch (e) {
      console.error('Error recalculando ruta:', e);
    } finally {
      this.recalculando = false;
    }
  }

  /** Recalcula la ruta desde la posición actual a los pedidos restantes */
  private async recalcularRuta(origen: UbicacionActualizada): Promise<void> {
    // ⚠️ IMPORTANTE: hacer copia de las entregas en el momento del cálculo
    // para que coincidan los índices con lo que devuelve OSRM
    const entregasOriginales = [...this.entregas];

    const paradas = entregasOriginales.map((p) => ({
      lat: Number(p.cliente?.latitud),
      lng: Number(p.cliente?.longitud),
    }));

    if (!paradas.length) return;

    const ruta = await firstValueFrom(
      this.routing.optimizarRuta(origen, paradas)
    );

    // ✅ Reordenar entregas según OSRM
    if (ruta?.orden && ruta.orden.length > 0) {
      // OSRM devuelve el orden de visita. orden[0] suele ser el origen (0).
      // Los demás son los índices 1..N de las paradas (1-indexed contando el origen).
      const ordenadas: Pedido[] = [];
      for (const i of ruta.orden) {
        // Saltar el origen (índice 0 en la lista paradas+origen)
        if (i === 0) continue;
        // i es 1-indexed contando el origen, por eso i-1 es el índice del array de entregas
        const entrega = entregasOriginales[i - 1];
        if (entrega) ordenadas.push(entrega);
      }

      // ✅ Solo reasignar si tenemos TODAS las entregas
      if (ordenadas.length === entregasOriginales.length) {
        this.entregas = ordenadas;
      } else {
        // Si OSRM omitió alguna, mantener el orden original
        console.warn(
          `[Recálculo] OSRM devolvió ${ordenadas.length} de ${entregasOriginales.length} paradas. Manteniendo orden original.`
        );
        this.entregas = entregasOriginales;
      }
      this.dibujarMarcadores();
    }

    // Polyline
    if (ruta?.geometria) {
      if (this.rutaLayer) this.rutaLayer.remove();
      const coords: [number, number][] = ruta.geometria.coordinates.map(
        ([lng, lat]: number[]) => [lat, lng]
      );
      this.coordenadasRuta = coords;

      this.rutaLayer = L.polyline(coords, {
        color: '#E11D48',
        weight: 5,
        opacity: 0.75,
        smoothFactor: 1,
      }).addTo(this.map);

      this.rutaLayer.bringToBack();
    }

    this.rutaInfo = {
      distancia: ruta?.distancia_texto ?? '',
      duracion: ruta?.duracion_texto ?? '',
    };

    this.cdr.markForCheck();
  }

  /** Distancia mínima en metros desde un punto hasta una polyline */
  private distanciaMinimaAPolyline(
    punto: [number, number],
    polyline: [number, number][]
  ): number {
    let minimaMetros = Infinity;
    for (let i = 0; i < polyline.length - 1; i++) {
      const d = this.distanciaPuntoASegmento(
        punto,
        polyline[i],
        polyline[i + 1]
      );
      if (d < minimaMetros) minimaMetros = d;
    }
    return minimaMetros;
  }

  /** Distancia en metros de un punto a un segmento (usando Leaflet) */
  private distanciaPuntoASegmento(
    p: [number, number],
    a: [number, number],
    b: [number, number]
  ): number {
    // Proyectar al plano usando Leaflet para mayor precisión
    const pPt = this.map.latLngToLayerPoint(p);
    const aPt = this.map.latLngToLayerPoint(a);
    const bPt = this.map.latLngToLayerPoint(b);
    const dx = bPt.x - aPt.x;
    const dy = bPt.y - aPt.y;
    let t = ((pPt.x - aPt.x) * dx + (pPt.y - aPt.y) * dy) / (dx * dx + dy * dy);
    t = Math.max(0, Math.min(1, t));
    const closest = { x: aPt.x + t * dx, y: aPt.y + t * dy };
    const closestLatLng = this.map.layerPointToLatLng(closest);
    return this.map.distance(p, [closestLatLng.lat, closestLatLng.lng]);
  }

  // ════════════════════════════════════════════════════════
  // BOTÓN CENTRAR EN MÍ
  // ════════════════════════════════════════════════════════
  centrarEnMi(): void {
    if (!this.tracking.ultimaUbicacion) return;
    this.seguirMiUbicacion = true;
    this.mostrarBotonSeguir = false;
    const u = this.tracking.ultimaUbicacion;
    this.map.flyTo([u.lat, u.lng], 16, { duration: 1 });
    this.cdr.markForCheck();
  }

  // ════════════════════════════════════════════════════════
  // INICIAR RUTA
  // ════════════════════════════════════════════════════════
  async iniciarRuta(): Promise<void> {
    if (!this.entregas.length) {
      const t = await this.toast.create({
        message: 'No hay entregas con ubicación',
        duration: 2000,
        color: 'warning',
        position: 'bottom',
      });
      await t.present();
      return;
    }

    const load = await this.loader.create({
      message: 'Calculando ruta óptima...',
    });
    await load.present();

    try {
      await this.tracking.iniciarRuta();

      this.seguirMiUbicacion = true;
      this.mostrarBotonSeguir = false;

      const origen = this.tracking.ultimaUbicacion!;
      await this.recalcularRuta(origen);
      this.ultimoRecalculo = Date.now() / 1000;

      await load.dismiss();
      this.cdr.markForCheck();
    } catch (e: any) {
      await load.dismiss();
      const t = await this.toast.create({
        message: e?.message ?? 'Error al iniciar la ruta',
        duration: 2500,
        color: 'danger',
        position: 'bottom',
      });
      await t.present();
    }
  }

  // ════════════════════════════════════════════════════════
  // TERMINAR RUTA
  // ════════════════════════════════════════════════════════
  async terminarRuta(): Promise<void> {
    const a = await this.alert.create({
      header: 'Terminar ruta',
      message: '¿Deseas finalizar el seguimiento?',
      buttons: [
        { text: 'No', role: 'cancel' },
        {
          text: 'Sí, terminar',
          role: 'destructive',
          handler: async () => {
            await this.tracking.terminarRuta();
            if (this.rutaLayer) {
              this.rutaLayer.remove();
              this.rutaLayer = null;
            }
            if (this.miMarker) {
              this.miMarker.remove();
              this.miMarker = null;
            }
            this.coordenadasRuta = [];
            this.rutaInfo = null;
            this.cdr.markForCheck();
          },
        },
      ],
    });
    await a.present();
  }

  // ════════════════════════════════════════════════════════
  centrarEn(p: Pedido): void {
    const lat = Number(p.cliente?.latitud);
    const lng = Number(p.cliente?.longitud);
    this.map.flyTo([lat, lng], 17, { duration: 1 });
    this.seguirMiUbicacion = false;
    this.mostrarBotonSeguir = this.rutaActiva;
    this.cdr.markForCheck();
  }

  navegar(p: Pedido, event: Event): void {
    event.stopPropagation();
    const lat = Number(p.cliente?.latitud);
    const lng = Number(p.cliente?.longitud);
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`,
      '_system'
    );
  }
}
