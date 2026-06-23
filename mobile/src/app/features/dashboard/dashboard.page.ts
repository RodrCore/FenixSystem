// ═══════════════════════════════════════════════════════════════
// FIX 4 — mobile/src/app/features/dashboard/dashboard.page.ts
// Dashboard con render condicional por rol
// ═══════════════════════════════════════════════════════════════

import {
  Component, OnInit, OnDestroy,
  ChangeDetectionStrategy, ChangeDetectorRef,
} from '@angular/core';
import { CommonModule }   from '@angular/common';
import { Router }         from '@angular/router';
import {
  IonContent, IonRefresher, IonRefresherContent,
} from '@ionic/angular/standalone';
import { Subject, takeUntil, catchError, of, forkJoin } from 'rxjs';
import { AuthService }   from '../../core/services/auth.service';
import { VentasService } from '../../core/services/ventas.service';
import { CartService }   from '../../core/services/cart.service';
import { DashboardVendedor, Pedido } from '../../core/models/venta.model';
import { NavbarComponent }   from '../../shared/components/navbar/navbar';
import { TabbarComponent }   from '../../shared/components/tabbar/tabbar';
import { ReplacePipe }       from '../../shared/pipes/replace.pipe';

@Component({
  selector:    'app-dashboard',
  standalone:  true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, IonContent, IonRefresher, IonRefresherContent,
    NavbarComponent, TabbarComponent, ReplacePipe,
  ],
  templateUrl: './dashboard.page.html',
  styleUrl:    './dashboard.page.scss',
})
export class DashboardPage implements OnInit, OnDestroy {
  // Datos
  ventasData:    DashboardVendedor | null = null;
  entregasStats = { pendientes: 0, en_ruta: 0, entregados_hoy: 0 };
  misEntregas:  Pedido[] = [];
  ventasRecientes: Pedido[] = [];     // últimas 5 del preventista
  ventasAdmin:    Pedido[] = [];      // últimas ventas del sistema (admin)
  entregasAdmin:  Pedido[] = [];      // últimas entregas del sistema (admin)
  loading = true;
  today   = new Date();
  private destroy$ = new Subject<void>();

  private readonly fallback: DashboardVendedor = {
    ventas_hoy: 0, ventas_ayer: 0, pedidos_hoy: 0, ultimos_pedidos: [],
  };

  constructor(
    public  auth:   AuthService,
    private ventas: VentasService,
    public  cart:   CartService,
    public  router: Router,
    private cdr:    ChangeDetectorRef,
  ) {}

  // ── Detección de rol ───────────────────────────────────────
  get esSuperAdmin(): boolean { return this.auth.hasRole('SUPER_ADMIN'); }
  get esAdmin():      boolean { return this.auth.hasRole('SUPER_ADMIN','ADMIN','GERENTE'); }
  get esRepartidor(): boolean {
    return this.auth.hasRole('REPARTIDOR') && !this.esAdmin;
  }
  get esPreventista(): boolean {
    return this.auth.hasRole('PREVENTISTA') && !this.esAdmin && !this.esRepartidor;
  }

  ngOnInit():    void { this.load(); }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  load(event?: any): void {
    this.loading = true;

    if (this.esRepartidor) {
      // Repartidor: stats de entregas + lista de pedidos a entregar
      forkJoin({
        stats:    this.ventas.getDashboardRepartidor().pipe(catchError(() => of(this.entregasStats))),
        entregas: this.ventas.getMisEntregas().pipe(catchError(() => of([]))),
      }).pipe(takeUntil(this.destroy$)).subscribe(({ stats, entregas }) => {
        this.entregasStats = stats;
        this.misEntregas   = entregas.slice(0, 5);
        this.loading       = false;
        event?.target?.complete();
        this.cdr.markForCheck();
      });
      return;
    }

    if (this.esAdmin) {
      // Admin: ver ventas hechas por preventistas + entregas hechas por repartidores
      forkJoin({
        ventas:   this.ventas.getPedidos({ page: 1, limit: 5 }).pipe(catchError(() => of({ data: [], total: 0, pages: 0 }))),
        entregas: this.ventas.getEntregasRecientes().pipe(catchError(() => of([]))),
      }).pipe(takeUntil(this.destroy$)).subscribe(({ ventas, entregas }) => {
        this.ventasAdmin   = ventas.data;
        this.entregasAdmin = entregas;
        this.loading       = false;
        event?.target?.complete();
        this.cdr.markForCheck();
      });
      return;
    }

    // Preventista: dashboard de ventas
    forkJoin({
      dashboard: this.ventas.getDashboard().pipe(catchError(() => of(this.fallback))),
      pedidos:   this.ventas.getPedidos({ page: 1, limit: 5 }).pipe(
        catchError(() => of({ data: [], total: 0, pages: 0 }))
      ),
    }).pipe(takeUntil(this.destroy$)).subscribe(({ dashboard, pedidos }) => {
      this.ventasData      = dashboard;
      this.ventasRecientes = pedidos.data;
      this.loading         = false;
      event?.target?.complete();
      this.cdr.markForCheck();
    });
  }

  // ── Datos del usuario ─────────────────────────────────────
  get nombreUsuario(): string { return this.auth.getCurrentUser()?.nombres ?? ''; }

  get deltaVentas(): number {
    if (!this.ventasData?.ventas_ayer) return 0;
    return ((this.ventasData.ventas_hoy - this.ventasData.ventas_ayer) / this.ventasData.ventas_ayer) * 100;
  }
  get deltaPositivo(): boolean { return this.deltaVentas >= 0; }

  estadoColor(estado: string): string {
    const m: Record<string, string> = {
      Borrador:          '#64748B', Confirmado: '#2563EB',
      Preparando:        '#D97706', Listo_Carga: '#7C3AED',
      En_Ruta:           '#0891B2',
      Entregado_Total:   '#059669', Entregado_Parcial: '#F59E0B',
      Cancelado:         '#DC2626', Devuelto: '#EF4444',
    };
    return m[estado] ?? '#64748B';
  }

  // ── Navegación ────────────────────────────────────────────
  irA(ruta: string): void { this.router.navigate([ruta]); }
}