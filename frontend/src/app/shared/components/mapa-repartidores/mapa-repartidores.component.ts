import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Input,
  ViewChild,
  ElementRef,
  NgZone,
  Output,
  EventEmitter,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Subject, takeUntil, firstValueFrom } from 'rxjs';
import { TrackingService, RepartidorActivo } from '../../../core/services/tracking.service';
import { environment } from '../../../../environments/environment';

import * as L from 'leaflet';

@Component({
  selector: 'app-mapa-repartidores',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mapa-repartidores.component.html',
  styleUrl: './mapa-repartidores.component.scss',
})
export class MapaRepartidoresComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('mapEl', { static: false }) mapEl!: ElementRef;

  @Input() titulo = 'Repartidores en tiempo real';
  @Input() pedidos: any[] = [];
  @Input() fullscreen = false;
  @Input() height = 280;

  @Output() expandir = new EventEmitter<void>();
  @Output() cerrar = new EventEmitter<void>();

  repartidores: Map<number, RepartidorActivo> = new Map();
  get repartidoresList(): RepartidorActivo[] {
    return Array.from(this.repartidores.values());
  }

  private map: any = null;
  private markersReps: Map<number, any> = new Map();
  private markersPedidos: any[] = [];
  private rutasLayers: Map<number, any> = new Map();
  private destroy$ = new Subject<void>();

  constructor(
    public tracking: TrackingService,
    private http: HttpClient,
    private zone: NgZone,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.tracking.repartidores$.pipe(takeUntil(this.destroy$)).subscribe((map) => {
      this.repartidores = map;
      this.actualizarMarcadoresRepartidores();
      this.cdr.markForCheck();
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.inicializarMapa(), 100);
  }

  // ✅ Detectar cuando cambia fullscreen
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['fullscreen'] && !changes['fullscreen'].firstChange) {
      setTimeout(() => this.invalidateMapSize(), 50);
      setTimeout(() => this.invalidateMapSize(), 200);
      setTimeout(() => this.invalidateMapSize(), 500);
    }

    // ✅ Solo redibujar si el array de pedidos cambió REALMENTE
    if (changes['pedidos'] && !changes['pedidos'].firstChange && this.map) {
      const prev = changes['pedidos'].previousValue ?? [];
      const curr = changes['pedidos'].currentValue ?? [];
      if (
        prev.length !== curr.length ||
        JSON.stringify(prev.map((p: any) => p.id)) !== JSON.stringify(curr.map((p: any) => p.id))
      ) {
        this.dibujarPedidos();
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.map?.remove();
  }

  // ════════════════════════════════════════════════════════
  // ✅ MÉTODO PÚBLICO para que el parent fuerce recalcular tamaño
  // ════════════════════════════════════════════════════════
  public invalidateMapSize(): void {
    if (!this.map) return;
    try {
      this.map.invalidateSize(true);
    } catch (e) {
      console.warn('Error invalidateSize:', e);
    }
  }

  private inicializarMapa(): void {
    if (!this.mapEl?.nativeElement) return;

    this.map = L.map(this.mapEl.nativeElement, {
      center: [-19.5836, -65.7531],
      zoom: 13,
      zoomControl: this.fullscreen,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap',
    }).addTo(this.map);

    this.dibujarPedidos();
    this.actualizarMarcadoresRepartidores();

    // ✅ Recalcular tamaño después de la creación inicial
    setTimeout(() => this.invalidateMapSize(), 200);
  }

  private dibujarPedidos(): void {
    this.markersPedidos.forEach((m) => m.remove());
    this.markersPedidos = [];

    this.pedidos.forEach((p) => {
      const lat = Number(p.cliente?.latitud);
      const lng = Number(p.cliente?.longitud);
      if (!lat || !lng) return;

      const entregado = ['Entregado_Total', 'Entregado_Parcial'].includes(p.estado);
      const color = entregado ? '#059669' : '#94A3B8';

      const icon = L.divIcon({
        html: `<div class="pedido-marker" style="background:${color}"></div>`,
        className: 'custom-marker-wrapper',
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      const m = L.marker([lat, lng], { icon }).addTo(this.map);
      m.bindPopup(`
        <strong>${p.numero_pedido ?? p.numero}</strong><br>
        ${p.cliente?.razon_social ?? ''}<br>
        <small>Bs ${Number(p.total_monto ?? p.total ?? 0).toFixed(2)}</small>
      `);
      this.markersPedidos.push(m);
    });
  }

  private actualizarMarcadoresRepartidores(): void {
    if (!this.map) return;

    for (const [id, marker] of this.markersReps.entries()) {
      if (!this.repartidores.has(id)) {
        marker.remove();
        this.markersReps.delete(id);
        const ruta = this.rutasLayers.get(id);
        ruta?.remove();
        this.rutasLayers.delete(id);
      }
    }

    this.repartidores.forEach((rep) => {
      const existing = this.markersReps.get(rep.repartidor_id);

      if (existing) {
        existing.setLatLng([rep.lat, rep.lng]);
      } else {
        const icon = L.divIcon({
          html: `<div class="repartidor-marker">
                   <div class="rm-pulse"></div>
                   <div class="rm-dot">${this.initials(rep.nombres)}</div>
                 </div>`,
          className: 'custom-marker-wrapper',
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        });

        const m = L.marker([rep.lat, rep.lng], { icon }).addTo(this.map);
        m.bindPopup(`<strong>${rep.nombres}</strong><br><small>En ruta</small>`);
        this.markersReps.set(rep.repartidor_id, m);

        if (this.fullscreen) {
          this.dibujarRutaRepartidor(rep);
        }
      }
    });
  }

  private async dibujarRutaRepartidor(rep: RepartidorActivo): Promise<void> {
    try {
      const pedidosRep = this.pedidos.filter(
        (p) =>
          p.repartidor_id === rep.repartidor_id &&
          ['Confirmado', 'Preparando', 'Listo_Carga', 'En_Ruta'].includes(p.estado),
      );
      if (!pedidosRep.length) return;

      const paradas = pedidosRep
        .filter((p) => p.cliente?.latitud && p.cliente?.longitud)
        .map((p) => ({
          lat: Number(p.cliente.latitud),
          lng: Number(p.cliente.longitud),
        }));

      if (!paradas.length) return;

      const ruta: any = await firstValueFrom(
        this.http.post(`${environment.apiUrl}/routing/optimizar`, {
          origen: { lat: rep.lat, lng: rep.lng },
          paradas,
        }),
      );

      const latlngs = ruta.geometria.coordinates.map(
        ([lng, lat]: [number, number]) => [lat, lng] as [number, number],
      );

      const ya = this.rutasLayers.get(rep.repartidor_id);
      ya?.remove();

      const polyline = L.polyline(latlngs, {
        color: '#7C3AED',
        weight: 4,
        opacity: 0.65,
        dashArray: '8, 8',
      }).addTo(this.map);
      this.rutasLayers.set(rep.repartidor_id, polyline);
    } catch (e) {
      // sin ruta
    }
  }

  centrarEn(rep: RepartidorActivo): void {
    this.map?.setView([rep.lat, rep.lng], 16);
  }

  initials(nombre: string): string {
    return nombre
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0] ?? '')
      .join('')
      .toUpperCase();
  }

  tiempoTranscurrido(d: string | Date): string {
    const date = typeof d === 'string' ? new Date(d) : d;
    const segs = Math.floor((Date.now() - date.getTime()) / 1000);
    if (segs < 60) return 'hace segundos';
    if (segs < 3600) return `hace ${Math.floor(segs / 60)} min`;
    return `hace ${Math.floor(segs / 3600)} h`;
  }

  onExpandir(ev?: Event): void {
    ev?.stopPropagation();
    this.expandir.emit();
  }
  onCerrar(): void {
    this.cerrar.emit();
  }
}
