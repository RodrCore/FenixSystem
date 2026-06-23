import {
  Component, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { ReportesService, ReporteFiltro } from './services/reportes.service';
import { FiltrosFechaComponent } from './components/filtros-fecha/filtros-fecha.component';
import { TabVentasComponent } from './components/tab-ventas/tab-ventas.component';
import { TabPedidosComponent } from './components/tab-pedidos/tab-pedidos.component';
import { TabReabastecimientosComponent } from './components/tab-reabastecimientos/tab-reabastecimientos.component';
import { TabInventarioComponent } from './components/tab-inventario/tab-inventario.component';
import { TabComercialComponent } from './components/tab-comercial/tab-comercial.component';
import { TabClientesComponent } from './components/tab-clientes/tab-clientes.component';

type Seccion =
  | 'ventas'
  | 'pedidos'
  | 'reabastecimientos'
  | 'inventario'
  | 'comercial'
  | 'clientes';

@Component({
  selector: 'app-reportes',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FiltrosFechaComponent,
    TabVentasComponent,
    TabPedidosComponent,
    TabReabastecimientosComponent,
    TabInventarioComponent,
    TabComercialComponent,
    TabClientesComponent,
  ],
  templateUrl: './reportes.page.html',
  styleUrl: './reportes.page.css',
})
export class ReportesPage implements OnDestroy {
  filtro: ReporteFiltro = { periodo: 'mes' };
  seccionActiva: Seccion = 'ventas';

  exportando = false;

  readonly secciones: { v: Seccion; n: string; icon: string }[] = [
    { v: 'ventas',            n: 'Ventas',           icon: '💰' },
    { v: 'pedidos',           n: 'Pedidos',          icon: '📦' },
    { v: 'reabastecimientos', n: 'Reabastecimiento', icon: '🚚' },
    { v: 'inventario',        n: 'Inventario',       icon: '📊' },
    { v: 'comercial',         n: 'Comercial',        icon: '👥' },
    { v: 'clientes',          n: 'Clientes',         icon: '🏪' },
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private svc: ReportesService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onFiltroChange(f: ReporteFiltro): void {
    this.filtro = f;
    this.cdr.markForCheck();
  }

  cambiarSeccion(s: Seccion): void {
    this.seccionActiva = s;
    this.cdr.markForCheck();
  }

  exportar(formato: 'excel' | 'pdf'): void {
    this.exportando = true;
    this.cdr.markForCheck();

    this.svc.exportar(this.seccionActiva, this.filtro, formato)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: blob => {
          this.exportando = false;
          this.cdr.markForCheck();

          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          const fecha = new Date().toISOString().slice(0, 10);
          const ext = formato === 'excel' ? 'xlsx' : 'pdf';
          a.href = url;
          a.download = `reporte_${this.seccionActiva}_${fecha}.${ext}`;
          a.click();
          setTimeout(() => URL.revokeObjectURL(url), 5000);
        },
        error: e => {
          this.exportando = false;
          this.cdr.markForCheck();
          alert(e?.error?.message || 'Error al exportar el reporte');
        },
      });
  }
}