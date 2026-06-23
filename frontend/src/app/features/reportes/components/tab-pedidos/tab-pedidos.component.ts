import {
  Component, Input, OnChanges, SimpleChanges, OnDestroy,
  ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, ElementRef, AfterViewInit, NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { ReportesService, ReporteFiltro } from '../../services/reportes.service';
import { KpiCardComponent } from '../kpi-card/kpi-card.component';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-tab-pedidos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, KpiCardComponent],
  templateUrl: './tab-pedidos.component.html',
  styleUrl: './tab-pedidos.component.css',
})
export class TabPedidosComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input() filtro!: ReporteFiltro;
  @ViewChild('chartEstados') chartEstadosRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartEvolucion') chartEvolucionRef?: ElementRef<HTMLCanvasElement>;

  data: any = null;
  loading = true;
  private chartEstados?: Chart;
  private chartEvolucion?: Chart;
  private destroy$ = new Subject<void>();
  private viewInit = false;

  constructor(private svc: ReportesService, private cdr: ChangeDetectorRef, private zone: NgZone) {}

  ngOnChanges(c: SimpleChanges): void { if (c['filtro']) this.cargar(); }
  ngAfterViewInit(): void { this.viewInit = true; if (this.data) this.dibujar(); }
  ngOnDestroy(): void {
    this.destroy$.next(); this.destroy$.complete();
    this.chartEstados?.destroy(); this.chartEvolucion?.destroy();
  }

  private cargar(): void {
    this.loading = true; this.cdr.markForCheck();
    this.svc.getPedidos(this.filtro).pipe(takeUntil(this.destroy$)).subscribe({
      next: d => {
        this.data = d; this.loading = false; this.cdr.markForCheck();
        if (this.viewInit) setTimeout(() => this.dibujar(), 50);
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); },
    });
  }

  private dibujar(): void {
    this.zone.runOutsideAngular(() => {
      this.dibujarEstados();
      this.dibujarEvolucion();
    });
  }

  private dibujarEstados(): void {
    if (!this.chartEstadosRef?.nativeElement || !this.data?.por_estado) return;
    this.chartEstados?.destroy();
    const colores: Record<string, string> = {
      Borrador: '#94A3B8',
      Confirmado: '#0891B2',
      Preparando: '#7C3AED',
      Listo_Carga: '#6366F1',
      En_Ruta: '#D97706',
      Entregado_Total: '#059669',
      Entregado_Parcial: '#84CC16',
      Cancelado: '#DC2626',
      Devuelto: '#EC4899',
    };
    this.chartEstados = new Chart(this.chartEstadosRef.nativeElement, {
      type: 'bar',
      data: {
        labels: this.data.por_estado.map((p: any) => p.estado),
        datasets: [{
          label: 'Cantidad',
          data: this.data.por_estado.map((p: any) => p.cantidad),
          backgroundColor: this.data.por_estado.map((p: any) => colores[p.estado] || '#64748B'),
          borderRadius: 6,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { font: { size: 10 } } },
          x: { ticks: { font: { size: 9 } } },
        },
      },
    });
  }

  private dibujarEvolucion(): void {
    if (!this.chartEvolucionRef?.nativeElement || !this.data?.evolucion) return;
    this.chartEvolucion?.destroy();
    this.chartEvolucion = new Chart(this.chartEvolucionRef.nativeElement, {
      type: 'line',
      data: {
        labels: this.data.evolucion.map((e: any) => e.fecha.slice(5)),
        datasets: [{
          label: 'Pedidos',
          data: this.data.evolucion.map((e: any) => e.cantidad),
          borderColor: '#0891B2',
          backgroundColor: 'rgba(8, 145, 178, 0.10)',
          tension: 0.3, fill: true,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } },
      },
    });
  }

  fmtBs(n: number): string {
    return new Intl.NumberFormat('es-BO', { minimumFractionDigits: 2 }).format(n || 0);
  }
}