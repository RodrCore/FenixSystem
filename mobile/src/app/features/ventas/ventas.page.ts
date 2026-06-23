import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent,
  IonRefresher,
  IonRefresherContent,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  AlertController,
} from '@ionic/angular/standalone';
import { Subject, takeUntil } from 'rxjs';
import { VentasService } from '../../core/services/ventas.service';
import { Pedido } from '../../core/models/venta.model';
import { NavbarComponent } from '../../shared/components/navbar/navbar';
import { TabbarComponent } from '../../shared/components/tabbar/tabbar';
import { RouterLink } from '@angular/router';
import { EditarPedidoModalComponent } from './editar-pedido-modal.component';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-ventas',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterLink,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    NavbarComponent,
    TabbarComponent,
    EditarPedidoModalComponent,
  ],
  templateUrl: './ventas.page.html',
  styleUrl: './ventas.page.scss',
})
export class VentasPage implements OnInit, OnDestroy {
  pedidos: Pedido[] = [];
  loading = true;
  page = 1;
  totalPages = 1;
  pedidoEditando: Pedido | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private ventas: VentasService,
    public router: Router,
    private alert: AlertController,
    private cdr: ChangeDetectorRef,
    public auth: AuthService,
  ) {}
  get esAdmin(): boolean {
    return this.auth.hasRole('SUPER_ADMIN', 'ADMIN', 'GERENTE');
  }
  ngOnInit(): void {
    this.load();
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  load(event?: any): void {
    if (!event) this.loading = true;
    this.ventas
      .getPedidos({ page: this.page, limit: 20 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.pedidos =
            this.page === 1 ? res.data : [...this.pedidos, ...res.data];
          this.totalPages = res.pages;
          this.loading = false;
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

  refrescar(event: any): void {
    this.page = 1;
    this.load(event);
  }

  cargarMas(event: any): void {
    if (this.page >= this.totalPages) {
      event.target.complete();
      return;
    }
    this.page++;
    this.load(event);
  }

  verDetalle(id: number): void {
    this.router.navigate(['/ventas/detalle', id]);
  }

  async cancelar(p: Pedido, ev: Event): Promise<void> {
    ev.stopPropagation();
    if (p.estado === 'Entregado_Total' || p.estado === 'Cancelado') return;

    const a = await this.alert.create({
      header: 'Cancelar venta',
      message: `¿Cancelar el pedido ${p.numero}?`,
      buttons: [
        { text: 'No', role: 'cancel' },
        {
          text: 'Sí, cancelar',
          role: 'destructive',
          handler: () => {
            this.ventas
              .cancelarPedido(p.id)
              .pipe(takeUntil(this.destroy$))
              .subscribe(() => {
                this.page = 1;
                this.load();
              });
          },
        },
      ],
      cssClass: 'fenix-alert',
    });
    await a.present();
  }

  estadoColor(estado: string): string {
    const m: Record<string, string> = {
      Borrador: '#64748B',
      Confirmado: '#2563EB',
      Preparando: '#D97706',
      Listo_Carga: '#7C3AED',
      En_Ruta: '#0891B2',
      Entregado_Parcial: '#F59E0B',
      Entregado_Total: '#059669',
      Cancelado: '#DC2626',
      Devuelto: '#EF4444',
    };
    return m[estado] ?? '#64748B';
  }

  puedeEditar(p: Pedido): boolean {
    return ['Borrador', 'Confirmado'].includes(p.estado);
  }
  puedeCancelar(p: Pedido): boolean {
    return ![
      'Entregado_Parcial',
      'Entregado_Total',
      'Cancelado',
      'Devuelto',
    ].includes(p.estado);
  }

  formatearEstado(estado: string): string {
    if (!estado) return '';
    return estado.replace(/_/g, ' ');
  }
  puedeEditarAsignacion(p: Pedido): boolean {
    // Solo admin puede cambiar vehículo/repartidor
    // Solo si el pedido no está entregado/cancelado
    if (!this.esAdmin) return false;
    return ![
      'Entregado_Total',
      'Entregado_Parcial',
      'Cancelado',
      'Devuelto',
    ].includes(p.estado);
  }
  // AGREGAR métodos:
  abrirEditar(p: Pedido, ev: Event): void {
    ev.stopPropagation();
    this.pedidoEditando = p;
    this.cdr.markForCheck();
  }

  onPedidoGuardado(): void {
    this.pedidoEditando = null;
    this.page = 1;
    this.load(); // recargar listado
  }

  onEditarCancelado(): void {
    this.pedidoEditando = null;
    this.cdr.markForCheck();
  }
}
