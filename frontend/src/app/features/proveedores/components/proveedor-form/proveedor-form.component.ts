import {
  Component, Input, Output, EventEmitter,
  OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild,
  ChangeDetectionStrategy, ChangeDetectorRef, NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ProveedoresService, Proveedor } from '../../services/proveedores.service';

declare const L: any;  // Leaflet global

// Coordenadas default: Potosí, Bolivia
const POTOSI_LAT = -19.5836;
const POTOSI_LNG = -65.7531;

@Component({
  selector:    'app-proveedor-form',
  standalone:  true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:     [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './proveedor-form.component.html',
  styleUrl:    './proveedor-form.component.css',
})
export class ProveedorFormComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() proveedor: Proveedor | null = null;
  @Output() saved     = new EventEmitter<Proveedor>();
  @Output() cancelled = new EventEmitter<void>();

  @ViewChild('mapaContainer', { static: false }) mapaContainer!: ElementRef;

  form!: FormGroup;
  guardando = false;
  errorMsg = '';
  seccionActiva: 'basico' | 'contacto' | 'ubicacion' | 'comercial' = 'basico';

  // Mapa
  private map: any = null;
  private marker: any = null;
  geocoding = false;

  private destroy$ = new Subject<void>();

  constructor(
    private svc: ProveedoresService,
    private fb:  FormBuilder,
    private cdr: ChangeDetectorRef,
    private http: HttpClient,
    private zone: NgZone,
  ) {}

  get esEdicion(): boolean {
    return !!this.proveedor;
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      // Básico
      razon_social:      [this.proveedor?.razon_social ?? '', [Validators.required, Validators.minLength(2)]],
      nombre_comercial:  [this.proveedor?.nombre_comercial ?? ''],
      nit_rfc:           [this.proveedor?.nit_rfc ?? ''],
      activo:            [this.proveedor?.activo ?? true],

      // Contacto
      contacto_nombres:  [this.proveedor?.contacto_nombres ?? ''],
      contacto_telefono: [this.proveedor?.contacto_telefono ?? ''],
      contacto_email:    [this.proveedor?.contacto_email ?? ''],

      // Ubicación
      direccion_completa: [this.proveedor?.direccion_completa ?? ''],
      latitud:            [this.proveedor?.latitud ?? null],
      longitud:           [this.proveedor?.longitud ?? null],

      // Comercial
      dias_entrega:      [this.proveedor?.dias_entrega ?? ''],
      condiciones_pago:  [this.proveedor?.condiciones_pago ?? ''],
      notas:             [this.proveedor?.notas ?? ''],
    });
  }

  ngAfterViewInit(): void {
    // El mapa se inicializa cuando se navega a esa pestaña
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.destruirMapa();
  }

  // ═══════════════════════════════════════════════
  // NAVEGACIÓN DE TABS
  // ═══════════════════════════════════════════════
  irSeccion(s: typeof this.seccionActiva): void {
    this.seccionActiva = s;
    this.cdr.markForCheck();
    if (s === 'ubicacion') {
      // Inicializar mapa al entrar a la pestaña (con delay para que el DOM esté listo)
      setTimeout(() => this.inicializarMapa(), 100);
    }
  }

  // ═══════════════════════════════════════════════
  // MAPA LEAFLET
  // ═══════════════════════════════════════════════
  private inicializarMapa(): void {
    if (this.map || !this.mapaContainer?.nativeElement) return;
    if (typeof L === 'undefined') {
      console.warn('Leaflet no está cargado. Verifica el index.html');
      return;
    }

    const lat = this.form.value.latitud || POTOSI_LAT;
    const lng = this.form.value.longitud || POTOSI_LNG;
    const hayUbicacion = !!this.form.value.latitud && !!this.form.value.longitud;

    this.zone.runOutsideAngular(() => {
      this.map = L.map(this.mapaContainer.nativeElement, {
        center: [lat, lng],
        zoom: hayUbicacion ? 16 : 13,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(this.map);

      if (hayUbicacion) {
        this.agregarMarker(lat, lng);
      }

      // Click en el mapa = mover marker
      this.map.on('click', (e: any) => {
        this.zone.run(() => {
          this.setUbicacion(e.latlng.lat, e.latlng.lng);
        });
      });

      // Fix de tamaño cuando el modal cambia
      setTimeout(() => this.map.invalidateSize(), 200);
    });
  }

  private agregarMarker(lat: number, lng: number): void {
    if (this.marker) {
      this.marker.setLatLng([lat, lng]);
      return;
    }
    this.marker = L.marker([lat, lng], { draggable: true }).addTo(this.map);
    this.marker.on('dragend', (e: any) => {
      const pos = e.target.getLatLng();
      this.zone.run(() => {
        this.setUbicacion(pos.lat, pos.lng, true);
      });
    });
  }

  private destruirMapa(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
      this.marker = null;
    }
  }

  /**
   * Establece lat/lng y, opcionalmente, hace geocoding inverso
   * para llenar la dirección.
   */
  setUbicacion(lat: number, lng: number, doGeocode = true): void {
    this.form.patchValue({
      latitud: parseFloat(lat.toFixed(7)),
      longitud: parseFloat(lng.toFixed(7)),
    });
    this.agregarMarker(lat, lng);
    this.cdr.markForCheck();

    if (doGeocode) {
      this.geocodingInverso(lat, lng);
    }
  }

  /**
   * Convierte lat/lng → dirección textual usando Nominatim
   */
  private geocodingInverso(lat: number, lng: number): void {
    this.geocoding = true;
    this.cdr.markForCheck();

    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=es`;
    this.http.get<any>(url).pipe(takeUntil(this.destroy$)).subscribe({
      next: r => {
        this.geocoding = false;
        if (r?.display_name) {
          // Solo sobrescribir si el campo está vacío
          if (!this.form.value.direccion_completa?.trim()) {
            this.form.patchValue({ direccion_completa: r.display_name });
          }
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.geocoding = false;
        this.cdr.markForCheck();
      },
    });
  }

  // ═══════════════════════════════════════════════
  // BOTONES DEL MAPA
  // ═══════════════════════════════════════════════
  miUbicacion(): void {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords;
        this.map?.setView([latitude, longitude], 17);
        this.setUbicacion(latitude, longitude);
      },
      err => alert('No se pudo obtener tu ubicación: ' + err.message),
    );
  }

  centrarPotosi(): void {
    this.map?.setView([POTOSI_LAT, POTOSI_LNG], 13);
  }

  quitarUbicacion(): void {
    if (this.marker) {
      this.map.removeLayer(this.marker);
      this.marker = null;
    }
    this.form.patchValue({ latitud: null, longitud: null });
    this.cdr.markForCheck();
  }

  // ═══════════════════════════════════════════════
  // GUARDAR
  // ═══════════════════════════════════════════════
  guardar(): void {
    this.errorMsg = '';
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMsg = 'La razón social es obligatoria (mínimo 2 caracteres)';
      this.cdr.markForCheck();
      return;
    }

    this.guardando = true;
    this.cdr.markForCheck();

    const dto = this.buildDto();
    const obs = this.esEdicion
      ? this.svc.update(this.proveedor!.id, dto)
      : this.svc.create(dto);

    obs.pipe(takeUntil(this.destroy$)).subscribe({
      next: result => {
        this.guardando = false;
        this.saved.emit(result);
      },
      error: e => {
        this.guardando = false;
        this.errorMsg = e?.error?.message ?? 'Error al guardar';
        this.cdr.markForCheck();
      },
    });
  }

  private buildDto(): any {
    const v = this.form.value;
    return {
      razon_social:      v.razon_social,
      nombre_comercial:  v.nombre_comercial || null,
      nit_rfc:           v.nit_rfc?.trim() || null,
      activo:            !!v.activo,
      contacto_nombres:  v.contacto_nombres || null,
      contacto_telefono: v.contacto_telefono || null,
      contacto_email:    v.contacto_email || null,
      direccion_completa: v.direccion_completa || null,
      latitud:           v.latitud,
      longitud:          v.longitud,
      dias_entrega:      v.dias_entrega || null,
      condiciones_pago:  v.condiciones_pago || null,
      notas:             v.notas || null,
    };
  }

  cancelar(): void {
    this.cancelled.emit();
  }
}