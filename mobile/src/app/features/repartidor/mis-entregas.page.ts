import {
  Component, OnInit, OnDestroy,
  ChangeDetectionStrategy, ChangeDetectorRef,
} from '@angular/core';
import { CommonModule }   from '@angular/common';
import { Router }         from '@angular/router';
import {
  IonContent, IonRefresher, IonRefresherContent,
} from '@ionic/angular/standalone';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { VentasService }   from '../../core/services/ventas.service';
import { Pedido }          from '../../core/models/venta.model';
import { NavbarComponent } from '../../shared/components/navbar/navbar';
import { ReplacePipe }     from '../../shared/pipes/replace.pipe';
import { TabbarComponent } from '../../shared/components/tabbar/tabbar';
 
@Component({
  selector:    'app-mis-entregas',
  standalone:  true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, IonContent, IonRefresher, IonRefresherContent,
    NavbarComponent, ReplacePipe, TabbarComponent,
  ],
  templateUrl: './mis-entregas.page.html',
  styleUrl:    './mis-entregas.page.scss',
})
export class MisEntregasPage implements OnInit, OnDestroy {
  entregas: Pedido[] = [];
  loading = true;
  stats   = { pendientes: 0, en_ruta: 0, entregados_hoy: 0 };
  private destroy$ = new Subject<void>();
 
  constructor(
    private ventas: VentasService,
    public router: Router,
    private cdr:    ChangeDetectorRef,
  ) {}
 
  ngOnInit():    void { this.cargar(); }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
 
  cargar(event?: any): void {
    if (!event) this.loading = true;
 
    forkJoin({
      entregas: this.ventas.getMisEntregas(),
      stats:    this.ventas.getDashboardRepartidor(),
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: ({ entregas, stats }) => {
        this.entregas = entregas;
        this.stats    = stats;
        this.loading  = false;
        event?.target?.complete();
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        event?.target?.complete();
        this.cdr.markForCheck();
      },
    });
  }
 
  // ── Acciones ──────────────────────────────────────────────
  verEnMapa(): void {
    this.router.navigate(['/repartidor/mapa']);
  }
 
  verDetalle(p: Pedido): void {
    this.router.navigate(['/ventas/detalle', p.id]);
  }
 
  llamar(p: Pedido, ev: Event): void {
    ev.stopPropagation();
    if (p.cliente?.contacto_telefono) {
      window.open(`tel:${p.cliente.contacto_telefono}`);
    }
  }
 
  whatsapp(p: Pedido, ev: Event): void {
    ev.stopPropagation();
    const num = (p.cliente as any)?.contacto_whatsapp ?? p.cliente?.contacto_telefono;
    if (num) window.open(`https://wa.me/${num.replace(/\D/g, '')}`);
  }
 
  // ── Abrir Google Maps con la dirección ────────────────────
  navegar(p: Pedido, ev: Event): void {
    ev.stopPropagation();
    const lat = Number((p.cliente as any)?.latitud);
    const lng = Number((p.cliente as any)?.longitud);
 
    if (!lat || !lng) {
      alert('Este cliente no tiene ubicación GPS registrada');
      return;
    }
 
    // Abre Google Maps / Waze / app de navegación predeterminada del celular
    const url = `https://www.google.com/maps/dir/?api=1` +
      `&destination=${lat},${lng}&travelmode=driving`;
    window.open(url, '_system');
  }
 
  // ── Helpers ───────────────────────────────────────────────
  estadoColor(estado: string): string {
    const m: Record<string, string> = {
      Confirmado:        '#2563EB',
      Preparando:        '#D97706',
      Listo_Carga:       '#7C3AED',
      En_Ruta:           '#0891B2',
      Entregado_Total:   '#059669',
      Entregado_Parcial: '#F59E0B',
    };
    return m[estado] ?? '#64748B';
  }
 
  tieneUbicacion(p: Pedido): boolean {
    const lat = Number((p.cliente as any)?.latitud);
    const lng = Number((p.cliente as any)?.longitud);
    return !!(lat && lng);
  }
}