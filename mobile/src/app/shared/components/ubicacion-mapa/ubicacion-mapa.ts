import {
  Component, OnInit, OnDestroy, AfterViewInit,
  Output, EventEmitter, Input,
  ChangeDetectionStrategy, ChangeDetectorRef,
  NgZone,
} from '@angular/core';
import { CommonModule }  from '@angular/common';
import { Geolocation }   from '@capacitor/geolocation';
import { Capacitor }     from '@capacitor/core';
import {
  IonContent, ToastController, LoadingController,
} from '@ionic/angular/standalone';
 
export interface LatLng { lat: number; lng: number; }
 
declare var L: any; // Leaflet global
 
@Component({
  selector:    'app-ubicacion-mapa',
  standalone:  true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:     [CommonModule],
  templateUrl: './ubicacion-mapa.html',
  styleUrl:    './ubicacion-mapa.scss',
})
export class UbicacionMapaComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input()  latInicial: number | null = null;
  @Input()  lngInicial: number | null = null;
  @Output() ubicacionSeleccionada = new EventEmitter<LatLng>();
  @Output() cancelado             = new EventEmitter<void>();
 
  coordenadas: LatLng | null = null;
  private map: any = null;
 
  // Potosí, Bolivia como centro por defecto
  private readonly DEFAULT_LAT = -19.5836;
  private readonly DEFAULT_LNG = -65.7531;
  private readonly DEFAULT_ZOOM = 16;
 
  constructor(
    private toast:   ToastController,
    private loader:  LoadingController,
    private zone:    NgZone,
    private cdr:     ChangeDetectorRef,
  ) {}
 
  ngOnInit(): void {}
 
  ngAfterViewInit(): void {
    // Dar tiempo al DOM para renderizar el contenedor
    setTimeout(() => this.inicializarMapa(), 200);
  }
 
  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }
 
  // ── Inicializar mapa Leaflet ──────────────────────────────
  private inicializarMapa(): void {
    const el = document.getElementById('mapa-cliente');
    if (!el || !L) {
      console.error('Leaflet o el contenedor no están disponibles');
      return;
    }
 
    const lat = this.latInicial ?? this.DEFAULT_LAT;
    const lng = this.lngInicial ?? this.DEFAULT_LNG;
 
    this.map = L.map('mapa-cliente', {
      center:      [lat, lng],
      zoom:        this.DEFAULT_ZOOM,
      zoomControl: false,
      attributionControl: true,
    });
 
    // Tiles OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 20,
    }).addTo(this.map);
 
    // Coordenadas iniciales
    this.coordenadas = { lat, lng };
 
    // Actualizar coordenadas cuando el mapa se mueve
    // El crosshair es fijo — leemos el centro del mapa
    this.map.on('move', () => {
      const center = this.map.getCenter();
      this.zone.run(() => {
        this.coordenadas = { lat: center.lat, lng: center.lng };
        this.cdr.markForCheck();
      });
    });
 
    // Si ya tenemos ubicación inicial, centrar en ella
    if (this.latInicial && this.lngInicial) {
      this.coordenadas = { lat: this.latInicial, lng: this.lngInicial };
    } else {
      // Intentar GPS automáticamente al abrir
      this.centrarGPS();
    }
  }
 
  // ── Centrar en posición GPS ───────────────────────────────
  async centrarGPS(): Promise<void> {
    const load = await this.loader.create({
      message: 'Obteniendo ubicación GPS...',
      duration: 8000,
    });
    await load.present();
 
    try {
      // Pedir permisos
      if (Capacitor.isNativePlatform()) {
        const perm = await Geolocation.requestPermissions();
        if (perm.location !== 'granted') {
          await load.dismiss();
          this.mostrarToast('Permiso de ubicación denegado', 'warning');
          return;
        }
      }
 
      const pos = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout:            8000,
      });
 
      await load.dismiss();
 
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
 
      this.map?.setView([lat, lng], 18);
      this.coordenadas = { lat, lng };
      this.cdr.markForCheck();
 
      this.mostrarToast('GPS obtenido correctamente', 'success');
 
    } catch (e) {
      await load.dismiss();
      this.mostrarToast('No se pudo obtener el GPS', 'warning');
    }
  }
 
  // ── Confirmar ubicación ───────────────────────────────────
  confirmar(): void {
    if (!this.coordenadas) return;
    // Leer el centro actual del mapa (más preciso que el último move)
    if (this.map) {
      const center = this.map.getCenter();
      this.coordenadas = { lat: center.lat, lng: center.lng };
    }
    this.ubicacionSeleccionada.emit(this.coordenadas);
  }
 
  cancelar(): void {
    this.cancelado.emit();
  }
 
  private async mostrarToast(msg: string, color: string): Promise<void> {
    const t = await this.toast.create({
      message: msg, duration: 2000, position: 'bottom', color,
    });
    await t.present();
  }
}