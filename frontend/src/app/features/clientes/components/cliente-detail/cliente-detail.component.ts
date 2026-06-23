import {
  Component, Input, Output, EventEmitter,
  OnChanges, SimpleChanges, AfterViewChecked,
  ChangeDetectionStrategy, ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';

import { ClientesService, Cliente } from '../../services/clientes.service';
import { AuthService } from '../../../auth/services/auth.service';

@Component({
  selector:    'app-cliente-detail',
  standalone:  true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:     [CommonModule],
  templateUrl: './cliente-detail.component.html',
  styleUrl:    './cliente-detail.component.css',
})
export class ClienteDetailComponent implements OnChanges, AfterViewChecked {
  @Input() clienteId: number | null = null;
  @Input() open = false;

  @Output() closed        = new EventEmitter<void>();
  @Output() editRequest   = new EventEmitter<Cliente>();
  @Output() deleteRequest = new EventEmitter<Cliente>();

  cliente: Cliente | null = null;
  loading = false;

  private map?: L.Map;
  private marker?: L.Marker;
  private mapInicializado = false;

  constructor(
    private svc:  ClientesService,
    private auth: AuthService,
    private cdr:  ChangeDetectorRef,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['clienteId'] && this.clienteId) {
      this.cargar();
    }
    if (changes['open'] && !this.open) {
      this.limpiarMapa();
      this.cliente = null;
    }
  }

  ngAfterViewChecked(): void {
    // Inicializar mapa cuando el DOM ya tiene el div
    if (this.cliente && this.tienesCoordenadas && !this.mapInicializado) {
      const el = document.getElementById('cliente-map');
      if (el) {
        this.mapInicializado = true;
        setTimeout(() => this.iniciarMapa(), 50);
      }
    }
  }

  private cargar(): void {
    if (!this.clienteId) return;
    this.loading = true;
    this.cliente = null;
    this.limpiarMapa();

    this.svc.getOne(this.clienteId).subscribe({
      next: c => {
        this.cliente = c;
        this.loading = false;
        this.mapInicializado = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  cerrar(): void {
    this.closed.emit();
  }

  // ═══════════════════════════════════════════════
  // MAPA
  // ═══════════════════════════════════════════════
  get tienesCoordenadas(): boolean {
    return !!(this.cliente?.latitud && this.cliente?.longitud);
  }

  private iniciarMapa(): void {
    if (!this.cliente || !this.tienesCoordenadas) return;
    const el = document.getElementById('cliente-map');
    if (!el || this.map) return;

    const lat = Number(this.cliente.latitud);
    const lng = Number(this.cliente.longitud);

    this.map = L.map('cliente-map', {
      center: [lat, lng],
      zoom: 16,
      zoomControl: true,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
    }).addTo(this.map);

    const icon = L.divIcon({
      className: 'cliente-marker',
      html: `<div style="width:32px;height:32px;border-radius:50% 50% 50% 0;
        background:#E11D48;transform:rotate(-45deg);
        border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.25);
        display:flex;align-items:center;justify-content:center;">
        <span style="transform:rotate(45deg);color:white;font-weight:700;font-size:12px;">📍</span>
      </div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });

    this.marker = L.marker([lat, lng], { icon })
      .addTo(this.map)
      .bindPopup(`<strong>${this.cliente.razon_social}</strong>`);

    setTimeout(() => this.map?.invalidateSize(), 100);
    setTimeout(() => this.map?.invalidateSize(), 400);
  }

  private limpiarMapa(): void {
    if (this.map) {
      this.map.remove();
      this.map = undefined;
      this.marker = undefined;
    }
    this.mapInicializado = false;
  }

  abrirEnGoogleMaps(): void {
    if (!this.tienesCoordenadas) return;
    const lat = this.cliente!.latitud;
    const lng = this.cliente!.longitud;
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
  }

  // ═══════════════════════════════════════════════
  // PERMISOS POR ROL
  // ═══════════════════════════════════════════════
  get rolActual(): string {
    return this.auth.getUsuario()?.rol?.nombre ?? '';
  }

  get esAdmin(): boolean {
    return ['SUPER_ADMIN', 'ADMIN', 'GERENTE'].includes(this.rolActual);
  }

  get puedeEditar(): boolean {
    return this.esAdmin && !this.cliente?.deleted_at;
  }

  get puedeEliminar(): boolean {
    return this.esAdmin && !this.cliente?.deleted_at;
  }

  // ═══════════════════════════════════════════════
  // ACCIONES
  // ═══════════════════════════════════════════════
  onEditar(): void {
    if (this.cliente) this.editRequest.emit(this.cliente);
  }

  onEliminar(): void {
    if (this.cliente) this.deleteRequest.emit(this.cliente);
  }

  llamar(): void {
    if (this.cliente?.contacto_telefono) {
      window.location.href = `tel:${this.cliente.contacto_telefono}`;
    }
  }

  whatsapp(): void {
    const tel = this.cliente?.contacto_whatsapp ?? this.cliente?.contacto_telefono;
    if (tel) {
      const clean = tel.replace(/\D/g, '');
      window.open(`https://wa.me/${clean}`, '_blank');
    }
  }

  // ═══════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════
  get nombreContacto(): string {
    if (!this.cliente) return '';
    const partes = [
      this.cliente.contacto_nombres,
      this.cliente.contacto_apellido_paterno,
      this.cliente.contacto_apellido_materno,
    ].filter(Boolean);
    return partes.join(' ') || '—';
  }

  get direccionCompleta(): string {
    if (!this.cliente) return '';
    const partes = [
      this.cliente.direccion_calle,
      this.cliente.direccion_numero,
      this.cliente.direccion_colonia,
      this.cliente.direccion_ciudad,
    ].filter(Boolean);
    return partes.join(', ') || '—';
  }

  estadoPedidoColor(estado: string): string {
    const m: Record<string, string> = {
      Borrador: '#64748B', Confirmado: '#2563EB',
      Preparando: '#D97706', Listo_Carga: '#7C3AED',
      En_Ruta: '#0891B2',
      Entregado_Total: '#059669', Entregado_Parcial: '#F59E0B',
      Cancelado: '#DC2626', Devuelto: '#EF4444',
    };
    return m[estado] ?? '#64748B';
  }
}