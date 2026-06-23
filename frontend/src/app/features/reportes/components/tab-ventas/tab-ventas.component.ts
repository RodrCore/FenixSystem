// ═══════════════════════════════════════════════════════════════
// frontend/src/app/features/reportes/components/tab-ventas/tab-ventas.component.ts
// ═══════════════════════════════════════════════════════════════

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
  selector: 'app-tab-ventas',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, KpiCardComponent],
  templateUrl: './tab-ventas.component.html',
  styleUrl: './tab-ventas.component.css',
})
export class TabVentasComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input() filtro!: ReporteFiltro;

  @ViewChild('chartEvolucion') chartEvolucionRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartPagos') chartPagosRef?: ElementRef<HTMLCanvasElement>;

  data: any = null;
  loading = true;

  private chartEvolucion?: Chart;
  private chartPagos?: Chart;
  private destroy$ = new Subject<void>();
  private viewInitialized = false;

  constructor(
    private svc: ReportesService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['filtro']) this.cargar();
  }

  ngAfterViewInit(): void {
    this.viewInitialized = true;
    if (this.data) this.dibujarGraficos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.chartEvolucion?.destroy();
    this.chartPagos?.destroy();
  }

  private cargar(): void {
    this.loading = true;
    this.cdr.markForCheck();

    this.svc.getVentas(this.filtro).pipe(takeUntil(this.destroy$)).subscribe({
      next: d => {
        this.data = d;
        this.loading = false;
        this.cdr.markForCheck();
        if (this.viewInitialized) setTimeout(() => this.dibujarGraficos(), 50);
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  private dibujarGraficos(): void {
    this.zone.runOutsideAngular(() => {
      this.dibujarEvolucion();
      this.dibujarPagos();
    });
  }

  private dibujarEvolucion(): void {
    if (!this.chartEvolucionRef?.nativeElement || !this.data?.evolucion) return;

    this.chartEvolucion?.destroy();
    this.chartEvolucion = new Chart(this.chartEvolucionRef.nativeElement, {
      type: 'line',
      data: {
        labels: this.data.evolucion.map((e: any) => e.fecha.slice(5)),
        datasets: [
          {
            label: 'Ventas (Bs)',
            data: this.data.evolucion.map((e: any) => e.total),
            borderColor: '#E11D48',
            backgroundColor: 'rgba(225, 29, 72, 0.10)',
            tension: 0.3,
            fill: true,
            pointRadius: 3,
            pointBackgroundColor: '#E11D48',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          y: { beginAtZero: true, ticks: { font: { size: 10 } } },
          x: { ticks: { font: { size: 10 } } },
        },
      },
    });
  }

  private dibujarPagos(): void {
    if (!this.chartPagosRef?.nativeElement || !this.data?.por_metodo_pago) return;

    this.chartPagos?.destroy();
    const colores = ['#E11D48', '#7C3AED', '#0891B2', '#D97706', '#059669', '#6366F1'];
    this.chartPagos = new Chart(this.chartPagosRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: this.data.por_metodo_pago.map((p: any) => p.metodo),
        datasets: [{
          data: this.data.por_metodo_pago.map((p: any) => p.total),
          backgroundColor: colores,
          borderWidth: 0,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { font: { size: 11 }, boxWidth: 12 } },
        },
      },
    });
  }

  fmtBs(n: number): string {
    return new Intl.NumberFormat('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);
  }
}