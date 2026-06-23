// ═══════════════════════════════════════════════════════════════
// frontend/src/app/features/clientes/components/cliente-form/cliente-form.component.ts
//
// V2: Con mapa interactivo Leaflet + geocoding reverso (Nominatim)
// ═══════════════════════════════════════════════════════════════

import {
  Component, Input, Output, EventEmitter,
  OnInit, OnDestroy, AfterViewChecked,
  ChangeDetectionStrategy, ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject, takeUntil, debounceTime, Subscription } from 'rxjs';
import * as L from 'leaflet';

import { ClientesService, Cliente } from '../../services/clientes.service';

// Coordenadas por defecto: Potosí
const POTOSI_LAT = -19.5836;
const POTOSI_LNG = -65.7531;

interface NominatimAddress {
  road?:           string;
  house_number?:   string;
  suburb?:         string;
  neighbourhood?:  string;
  city?:           string;
  town?:           string;
  village?:        string;
  state?:          string;
  postcode?:       string;
  country?:        string;
}

interface NominatimResponse {
  display_name?: string;
  address?:      NominatimAddress;
}

@Component({
  selector:    'app-cliente-form',
  standalone:  true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:     [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './cliente-form.component.html',
  styleUrl:    './cliente-form.component.css',
})
export class ClienteFormComponent implements OnInit, OnDestroy, AfterViewChecked {
  @Input() cliente: Cliente | null = null;
  @Output() saved     = new EventEmitter<Cliente>();
  @Output() cancelled = new EventEmitter<void>();

  form!: FormGroup;
  guardando = false;
  errorMsg = '';
  seccionActiva: 'negocio' | 'contacto' | 'direccion' | 'comercial' | 'otros' = 'negocio';

  readonly tiposCliente = [
    'Minorista', 'Mayorista', 'Distribuidor', 'Kiosco', 'Supermercado',
  ];

  readonly regimenesFiscales = [
    'General', 'Simplificado', 'Régimen Tributario Simplificado',
    'Sistema Tributario Integrado', 'Otro',
  ];

  // Mapa
  private map?: L.Map;
  private marker?: L.Marker;
  private mapInicializado = false;
  geocoding = false;          // mostrando "buscando dirección..."

  private destroy$ = new Subject<void>();

  constructor(
    private svc: ClientesService,
    private fb:  FormBuilder,
    private cdr: ChangeDetectorRef,
    private http: HttpClient,
  ) {}

  get esEdicion(): boolean {
    return !!this.cliente;
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      razon_social:               [this.cliente?.razon_social ?? '', [Validators.required, Validators.minLength(3)]],
      nombre_comercial:           [this.cliente?.nombre_comercial ?? ''],
      nit_rfc:                    [this.cliente?.nit_rfc ?? ''],
      regimen_fiscal:             [this.cliente?.regimen_fiscal ?? ''],
      tipo_cliente:               [this.cliente?.tipo_cliente ?? 'Minorista'],

      contacto_nombres:           [this.cliente?.contacto_nombres ?? ''],
      contacto_apellido_paterno:  [this.cliente?.contacto_apellido_paterno ?? ''],
      contacto_apellido_materno:  [this.cliente?.contacto_apellido_materno ?? ''],
      contacto_telefono:          [this.cliente?.contacto_telefono ?? '', [Validators.required]],
      contacto_whatsapp:          [this.cliente?.contacto_whatsapp ?? ''],
      contacto_email:             [this.cliente?.contacto_email ?? '', [Validators.email]],

      direccion_calle:            [this.cliente?.direccion_calle ?? ''],
      direccion_numero:           [this.cliente?.direccion_numero ?? ''],
      direccion_colonia:          [this.cliente?.direccion_colonia ?? ''],
      direccion_ciudad:           [this.cliente?.direccion_ciudad ?? 'Potosí'],
      direccion_codigo_postal:    [this.cliente?.direccion_codigo_postal ?? ''],
      direccion_referencias:      [this.cliente?.direccion_referencias ?? ''],
      latitud:                    [this.cliente?.latitud ?? null],
      longitud:                   [this.cliente?.longitud ?? null],

      credito_habilitado:         [this.cliente?.credito_habilitado ?? false],
      limite_credito:             [this.cliente?.limite_credito ?? 0],
      dias_credito:               [this.cliente?.dias_credito ?? 0],

      horario_recepcion_desde:    [this.formatHora(this.cliente?.horario_recepcion_desde)],
      horario_recepcion_hasta:    [this.formatHora(this.cliente?.horario_recepcion_hasta)],
      dias_entrega:               [this.cliente?.dias_entrega ?? ''],
      notas_internas:             [this.cliente?.notas_internas ?? ''],
      estado:                     [this.cliente?.estado ?? 'Activo'],
    });
  }

  ngAfterViewChecked(): void {
    // Inicializar mapa cuando estás en la sección dirección y aún no se inició
    if (this.seccionActiva === 'direccion' && !this.mapInicializado) {
      const el = document.getElementById('cliente-form-map');
      if (el) {
        this.mapInicializado = true;
        setTimeout(() => this.iniciarMapa(), 50);
      }
    }
  }

  ngOnDestroy(): void {
    this.limpiarMapa();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private formatHora(v: any): string {
    if (!v) return '';
    try {
      const d = new Date(v);
      const h = String(d.getHours()).padStart(2, '0');
      const m = String(d.getMinutes()).padStart(2, '0');
      return `${h}:${m}`;
    } catch {
      return '';
    }
  }

  // ═══════════════════════════════════════════════
  // SECCIONES
  // ═══════════════════════════════════════════════
  irSeccion(s: typeof this.seccionActiva): void {
    this.seccionActiva = s;

    // Si estaba en dirección y nos salimos, marca para reinicializar al volver
    if (s !== 'direccion') {
      this.mapInicializado = false;
      this.limpiarMapa();
    }

    this.cdr.markForCheck();
  }

  // ═══════════════════════════════════════════════
  // MAPA
  // ═══════════════════════════════════════════════
  private iniciarMapa(): void {
    const el = document.getElementById('cliente-form-map');
    if (!el || this.map) return;

    const lat = Number(this.form.value.latitud) || POTOSI_LAT;
    const lng = Number(this.form.value.longitud) || POTOSI_LNG;
    const tieneCoords = !!(this.form.value.latitud && this.form.value.longitud);

    this.map = L.map('cliente-form-map', {
      center: [lat, lng],
      zoom: tieneCoords ? 17 : 14,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
    }).addTo(this.map);

    if (tieneCoords) {
      this.colocarMarker(lat, lng);
    }

    // Click en el mapa → poner marcador y geocodificar
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.colocarMarker(e.latlng.lat, e.latlng.lng);
      this.actualizarCoordenadasForm(e.latlng.lat, e.latlng.lng);
      this.geocodificarDireccion(e.latlng.lat, e.latlng.lng);
    });

    setTimeout(() => this.map?.invalidateSize(), 100);
    setTimeout(() => this.map?.invalidateSize(), 400);
  }

  private colocarMarker(lat: number, lng: number): void {
    if (!this.map) return;

    const icon = L.divIcon({
      className: 'form-marker',
      html: `<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;
        background:#E11D48;transform:rotate(-45deg);
        border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.25);"></div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 28],
    });

    if (this.marker) {
      this.marker.setLatLng([lat, lng]);
    } else {
      this.marker = L.marker([lat, lng], { icon, draggable: true }).addTo(this.map);

      // Permitir arrastrar el marcador para ajustar
      this.marker.on('dragend', () => {
        const pos = this.marker!.getLatLng();
        this.actualizarCoordenadasForm(pos.lat, pos.lng);
        this.geocodificarDireccion(pos.lat, pos.lng);
      });
    }
  }

  private actualizarCoordenadasForm(lat: number, lng: number): void {
    this.form.patchValue({
      latitud:  Number(lat.toFixed(7)),
      longitud: Number(lng.toFixed(7)),
    });
    this.cdr.markForCheck();
  }

  private limpiarMapa(): void {
    if (this.map) {
      this.map.remove();
      this.map = undefined;
      this.marker = undefined;
    }
  }

  // ═══════════════════════════════════════════════
  // GEOCODIFICACIÓN INVERSA (lat/lng → dirección)
  // Usa Nominatim de OpenStreetMap (gratuito, rate-limited)
  // ═══════════════════════════════════════════════
  private geocodificarDireccion(lat: number, lng: number): void {
    this.geocoding = true;
    this.cdr.markForCheck();

    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;

    this.http.get<NominatimResponse>(url, {
      headers: { 'Accept-Language': 'es' },
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: res => {
        this.geocoding = false;

        if (!res?.address) {
          this.cdr.markForCheck();
          return;
        }

        const a = res.address;
        const updates: any = {};

        // Solo llenar si el campo está vacío (no sobrescribir lo que el usuario escribió)
        const f = this.form.value;

        if (!f.direccion_calle && a.road) {
          updates.direccion_calle = a.road;
        }
        if (!f.direccion_numero && a.house_number) {
          updates.direccion_numero = a.house_number;
        }
        if (!f.direccion_colonia && (a.suburb || a.neighbourhood)) {
          updates.direccion_colonia = a.suburb || a.neighbourhood;
        }
        if (a.city || a.town || a.village) {
          updates.direccion_ciudad = a.city || a.town || a.village;
        }
        if (!f.direccion_codigo_postal && a.postcode) {
          updates.direccion_codigo_postal = a.postcode;
        }

        if (Object.keys(updates).length) {
          this.form.patchValue(updates);
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
  // OBTENER MI UBICACIÓN
  // ═══════════════════════════════════════════════
  obtenerMiUbicacion(): void {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      pos => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        this.actualizarCoordenadasForm(lat, lng);

        if (this.map) {
          this.map.setView([lat, lng], 17);
          this.colocarMarker(lat, lng);
        }

        this.geocodificarDireccion(lat, lng);
      },
      err => {
        alert('No se pudo obtener la ubicación: ' + err.message);
      },
    );
  }

  // ═══════════════════════════════════════════════
  // CENTRAR EN POTOSÍ
  // ═══════════════════════════════════════════════
  centrarEnPotosi(): void {
    if (this.map) {
      this.map.setView([POTOSI_LAT, POTOSI_LNG], 14);
    }
  }

  // ═══════════════════════════════════════════════
  // LIMPIAR COORDENADAS
  // ═══════════════════════════════════════════════
  limpiarCoordenadas(): void {
    this.form.patchValue({ latitud: null, longitud: null });
    if (this.marker && this.map) {
      this.map.removeLayer(this.marker);
      this.marker = undefined;
    }
    this.cdr.markForCheck();
  }

  // ═══════════════════════════════════════════════
  // GUARDAR
  // ═══════════════════════════════════════════════
  guardar(): void {
    this.errorMsg = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      const errors: string[] = [];
      if (this.form.get('razon_social')?.invalid) errors.push('Razón social es requerida');
      if (this.form.get('contacto_telefono')?.invalid) errors.push('Teléfono es requerido');
      if (this.form.get('contacto_email')?.invalid) errors.push('Email inválido');

      this.errorMsg = errors.join(' · ');
      this.cdr.markForCheck();
      return;
    }

    this.guardando = true;
    this.cdr.markForCheck();

    const dto = this.buildDto();

    // 🔍 LOG temporal para diagnóstico
    console.log('[ClienteForm] DTO enviado:', dto);

    const obs = this.esEdicion
      ? this.svc.update(this.cliente!.id, dto)
      : this.svc.create(dto);

    obs.pipe(takeUntil(this.destroy$)).subscribe({
      next: c => {
        console.log('[ClienteForm] Cliente guardado:', c);
        this.guardando = false;
        this.saved.emit(c);
      },
      error: e => {
        console.error('[ClienteForm] Error al guardar:', e);
        this.guardando = false;
        this.errorMsg = e?.error?.message ?? 'Error al guardar el cliente';
        this.cdr.markForCheck();
      },
    });
  }

  private buildDto(): any {
    const v = this.form.value;

    const dto: any = {
      razon_social: v.razon_social,
      contacto_telefono: v.contacto_telefono,
      estado: v.estado,
      credito_habilitado: !!v.credito_habilitado,
    };

    // ✅ FIX: incluir tipo_cliente y regimen_fiscal SIEMPRE (no como opcional)
    if (v.tipo_cliente) dto.tipo_cliente = v.tipo_cliente;
    if (v.regimen_fiscal) dto.regimen_fiscal = v.regimen_fiscal;

    const opcionales = [
      'nombre_comercial', 'nit_rfc',
      'contacto_nombres', 'contacto_apellido_paterno', 'contacto_apellido_materno',
      'contacto_whatsapp', 'contacto_email',
      'direccion_calle', 'direccion_numero', 'direccion_colonia',
      'direccion_ciudad', 'direccion_codigo_postal', 'direccion_referencias',
      'dias_entrega', 'notas_internas',
    ];
    opcionales.forEach(k => {
      if (v[k] !== null && v[k] !== '' && v[k] !== undefined) {
        dto[k] = v[k];
      }
    });

    if (v.latitud !== null && v.latitud !== '') dto.latitud = Number(v.latitud);
    if (v.longitud !== null && v.longitud !== '') dto.longitud = Number(v.longitud);

    if (v.credito_habilitado) {
      dto.limite_credito = Number(v.limite_credito) || 0;
      dto.dias_credito = Number(v.dias_credito) || 0;
    } else {
      dto.limite_credito = 0;
      dto.dias_credito = 0;
    }

    if (v.horario_recepcion_desde) {
      const [h, m] = v.horario_recepcion_desde.split(':');
      const fecha = new Date();
      fecha.setHours(+h, +m, 0, 0);
      dto.horario_recepcion_desde = fecha.toISOString();
    }
    if (v.horario_recepcion_hasta) {
      const [h, m] = v.horario_recepcion_hasta.split(':');
      const fecha = new Date();
      fecha.setHours(+h, +m, 0, 0);
      dto.horario_recepcion_hasta = fecha.toISOString();
    }

    return dto;
  }

  cancelar(): void {
    this.cancelled.emit();
  }
}