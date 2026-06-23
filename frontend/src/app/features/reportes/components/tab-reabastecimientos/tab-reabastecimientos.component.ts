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
  selector: 'app-tab-reabastecimientos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, KpiCardComponent],
  templateUrl: './tab-reabastecimientos.component.html',
  styleUrl: './tab-reabastecimientos.component.css',
})
export class TabReabastecimientosComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input() filtro!: ReporteFiltro;
  @ViewChild('chartProveedores') chartProvRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartEstados') chartEstadosRef?: ElementRef<HTMLCanvasElement>;

  data: any = null;
  loading = true;
  private chartProv?: Chart;
  private chartEstados?: Chart;
  private destroy$ = new Subject<void>();
  private viewInit = false;

  constructor(private svc: ReportesService, private cdr: ChangeDetectorRef, private zone: NgZone) {}

  ngOnChanges(c: SimpleChanges): void { if (c['filtro']) this.cargar(); }
  ngAfterViewInit(): void { this.viewInit = true; if (this.data) this.dibujar(); }
  ngOnDestroy(): void {
    this.destroy$.next(); this.destroy$.complete();
    this.chartProv?.destroy(); this.chartEstados?.destroy();
  }

  private cargar(): void {
    this.loading = true; this.cdr.markForCheck();
    this.svc.getReabastecimientos(this.filtro).pipe(takeUntil(this.destroy$)).subscribe({
      next: d => {
        this.data = d; this.loading = false; this.cdr.markForCheck();
        if (this.viewInit) setTimeout(() => this.dibujar(), 50);
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); },
    });
  }

  private dibujar(): void {
    this.zone.runOutsideAngular(() => {
      this.dibujarProveedores();
      this.dibujarEstados();
    });
  }

  private dibujarProveedores(): void {
    if (!this.chartProvRef?.nativeElement || !this.data?.por_proveedor) return;
    this.chartProv?.destroy();
    this.chartProv = new Chart(this.chartProvRef.nativeElement, {
      type: 'bar',
      data: {
        labels: this.data.por_proveedor.map((p: any) => p.nombre),
        datasets: [{
          label: 'Total Bs',
          data: this.data.por_proveedor.map((p: any) => p.total_comprado),
          backgroundColor: '#7C3AED',
          borderRadius: 6,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false, indexAxis: 'y',
        plugins: { legend: { display: false } },
        scales: {
          x: { beginAtZero: true, ticks: { font: { size: 10 } } },
          y: { ticks: { font: { size: 10 } } },
        },
      },
    });
  }

  private dibujarEstados(): void {
    if (!this.chartEstadosRef?.nativeElement || !this.data?.por_estado) return;
    this.chartEstados?.destroy();
    const colores: Record<string, string> = {
      Pendiente: '#D97706',
      Recibido_Total: '#059669',
      Recibido_Parcial: '#0891B2',
      Cancelado: '#94A3B8',
    };
    this.chartEstados = new Chart(this.chartEstadosRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: this.data.por_estado.map((p: any) => p.estado),
        datasets: [{
          data: this.data.por_estado.map((p: any) => p.cantidad),
          backgroundColor: this.data.por_estado.map((p: any) => colores[p.estado] || '#64748B'),
          borderWidth: 0,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, boxWidth: 12 } } },
      },
    });
  }

  fmtBs(n: number): string {
    return new Intl.NumberFormat('es-BO', { minimumFractionDigits: 2 }).format(n || 0);
  }
}