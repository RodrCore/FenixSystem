// frontend/src/app/features/dashboard/components/mini-map/mini-map.ts

import {
  Component, OnInit, OnDestroy, AfterViewInit, NgZone,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import * as L from 'leaflet';
import {
  TrackingService,
  RepartidorActivo,
} from '../../../../core/services/tracking.service';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'assets/marker-icon-2x.png',
  iconUrl:       'assets/marker-icon.png',
  shadowUrl:     'assets/marker-shadow.png',
});

function buildIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<div style="
      width: 44px; height: 44px;
      display: flex; align-items: center; justify-content: center;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.30));
    ">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="0.8">
        <path d="M3 6c0-1.1.9-2 2-2h14c1.1 0 2 .9 2 2v10h-2c0 1.66-1.34 3-3 3s-3-1.34-3-3H10c0 1.66-1.34 3-3 3s-3-1.34-3-3H2V6h1zm2 0v8h.76c.55-.61 1.35-1 2.24-1s1.69.39 2.24 1H15V6H5zm12 2h2.5l1.5 2v4h-4V8zM7 15.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm10 0c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5z"/>
      </svg>
    </div>`,
    iconSize:    [44, 44],
    iconAnchor:  [22, 22],
    popupAnchor: [0, -22],
  });
}

@Component({
  selector:    'app-mini-map',
  standalone:  true,
  imports:     [CommonModule],
  templateUrl: './mini-map.html',
  styleUrl:    './mini-map.css',
})
export class MiniMapComponent implements OnInit, AfterViewInit, OnDestroy {
  private mapCompact!:  L.Map;
  private mapFullscreen: L.Map | null = null;
  private markersCompact   = new Map<number, L.Marker>();
  private markersFullscreen = new Map<number, L.Marker>();
  private destroy$         = new Subject<void>();
  private resizeObserver!: ResizeObserver;

  repartidores: RepartidorActivo[] = [];
  fullscreen   = false;

  // ── Clasificación por tiempo desde última actualización ──
  private clasificar(r: RepartidorActivo): 'en_transito' | 'detenido' | 'retrasado' {
    const segs = (Date.now() - new Date(r.ultima_actualizacion).getTime()) / 1000;
    if (segs < 60)  return 'en_transito';
    if (segs < 180) return 'detenido';
    return 'retrasado';
  }

  get enTransito(): number { return this.repartidores.filter(r => this.clasificar(r) === 'en_transito').length; }
  get detenidos():  number { return this.repartidores.filter(r => this.clasificar(r) === 'detenido').length; }
  get retrasados(): number { return this.repartidores.filter(r => this.clasificar(r) === 'retrasado').length; }

  constructor(
    private trackingService: TrackingService,
    private zone:            NgZone,
    private cdr:             ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.trackingService.repartidores$
      .pipe(takeUntil(this.destroy$))
      .subscribe((map: Map<number, RepartidorActivo>) => {
        this.repartidores = Array.from(map.values());
        this.cdr.markForCheck();
        this.zone.runOutsideAngular(() => {
          this.updateMarkers(this.mapCompact, this.markersCompact, this.repartidores);
          if (this.mapFullscreen) {
            this.updateMarkers(this.mapFullscreen, this.markersFullscreen, this.repartidores);
          }
        });
      });
  }

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      setTimeout(() => this.initMapCompact(), 200);
    });
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.destroy$.next();
    this.destroy$.complete();
    this.mapCompact?.remove();
    this.mapFullscreen?.remove();
  }

  // ── MAPA COMPACT ─────────────────────────────────────────
  private initMapCompact(): void {
    const container = document.getElementById('mini-map');
    if (!container) return;
    if (container.offsetWidth === 0 || container.offsetHeight === 0) {
      setTimeout(() => this.initMapCompact(), 200);
      return;
    }

    this.mapCompact = L.map(container, {
      center:             [-19.5836, -65.7531],
      zoom:               13,
      zoomControl:        false,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(this.mapCompact);

    L.control.attribution({
      position: 'bottomright',
      prefix:   '© <a href="https://openstreetmap.org">OSM</a>',
    }).addTo(this.mapCompact);

    setTimeout(() => this.mapCompact.invalidateSize(), 50);

    this.resizeObserver = new ResizeObserver(() => this.mapCompact?.invalidateSize());
    this.resizeObserver.observe(container);

    if (this.repartidores.length) {
      this.updateMarkers(this.mapCompact, this.markersCompact, this.repartidores);
    }
  }

  // ── MAPA FULLSCREEN ──────────────────────────────────────
  abrirFullscreen(): void {
    this.fullscreen = true;
    this.cdr.detectChanges();   // ⚠️ forzar render del DOM ANTES de inicializar

    this.zone.runOutsideAngular(() => {
      setTimeout(() => this.initMapFullscreen(), 100);
    });
  }

  cerrarFullscreen(): void {
    this.mapFullscreen?.remove();
    this.mapFullscreen = null;
    this.markersFullscreen.clear();
    this.fullscreen = false;
    this.cdr.detectChanges();
  }

  private initMapFullscreen(): void {
    const container = document.getElementById('mini-map-fullscreen');
    if (!container) return;
    if (container.offsetWidth === 0 || container.offsetHeight === 0) {
      setTimeout(() => this.initMapFullscreen(), 100);
      return;
    }

    this.mapFullscreen = L.map(container, {
      center:             this.mapCompact?.getCenter() ?? [-19.5836, -65.7531],
      zoom:               14,
      zoomControl:        true,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(this.mapFullscreen);

    L.control.attribution({
      position: 'bottomright',
      prefix:   '© <a href="https://openstreetmap.org">OSM</a>',
    }).addTo(this.mapFullscreen);

    // ✅ Forzar recálculo de tamaño después de que el modal esté renderizado
    setTimeout(() => this.mapFullscreen?.invalidateSize(), 100);
    setTimeout(() => this.mapFullscreen?.invalidateSize(), 400);  // segunda pasada por si la primera fue muy temprano

    if (this.repartidores.length) {
      this.updateMarkers(this.mapFullscreen, this.markersFullscreen, this.repartidores);
      // Ajustar zoom para mostrar todos
      const markers = Array.from(this.markersFullscreen.values());
      if (markers.length > 0) {
        const group = L.featureGroup(markers);
        this.mapFullscreen.fitBounds(group.getBounds().pad(0.2));
      }
    }
  }

  // ── UPDATE MARKERS (compartido entre ambos mapas) ────────
  private updateMarkers(
    map: L.Map | undefined,
    markersMap: Map<number, L.Marker>,
    positions: RepartidorActivo[],
  ): void {
    if (!map) return;

    positions.forEach(rep => {
      const estado = this.clasificar(rep);
      const color  = estado === 'en_transito' ? '#059669'
                   : estado === 'detenido'    ? '#D97706' : '#DC2626';
      const emoji  = estado === 'en_transito' ? '🚐'
                   : estado === 'detenido'    ? '■' : '!';

const icon = buildIcon(color);      const popup = this.buildPopup(rep, estado);
      const existing = markersMap.get(rep.repartidor_id);

      if (existing) {
        existing.setLatLng([rep.lat, rep.lng]);
        existing.setIcon(icon);
        existing.setPopupContent(popup);
      } else {
        const marker = L.marker([rep.lat, rep.lng], { icon })
          .addTo(map)
          .bindPopup(popup, { maxWidth: 200 });
        markersMap.set(rep.repartidor_id, marker);
      }
    });

    markersMap.forEach((marker, id) => {
      if (!positions.find(p => p.repartidor_id === id)) {
        marker.remove();
        markersMap.delete(id);
      }
    });
  }

  private buildPopup(rep: RepartidorActivo, estado: string): string {
    const colors: Record<string, string> = {
      en_transito: '#059669', detenido: '#D97706', retrasado: '#DC2626',
    };
    const labels: Record<string, string> = {
      en_transito: 'En tránsito', detenido: 'Detenido', retrasado: 'Retrasado',
    };
    const color = colors[estado];
    const label = labels[estado];
    const time  = new Date(rep.ultima_actualizacion).toLocaleTimeString('es-BO');
    return `
      <div style="font-family:Inter,sans-serif;min-width:150px;">
        <p style="font-size:13px;font-weight:600;margin:0 0 4px;color:#0F172A;">${rep.nombres}</p>
        <p style="font-size:11px;color:#64748B;margin:0 0 6px;">
          ${rep.pedido_id ? `Pedido: ${rep.pedido_id}` : 'En ruta'}
        </p>
        <span style="
          display:inline-block;font-size:10px;font-weight:500;
          padding:2px 8px;border-radius:999px;
          background:${color}22;color:${color};
        ">${label}</span>
        <p style="font-size:10px;color:#94A3B8;margin:6px 0 0;">${time}</p>
      </div>
    `;
  }
}