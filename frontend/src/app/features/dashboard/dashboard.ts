import {
  Component, OnInit, OnDestroy, AfterViewInit,
  ChangeDetectionStrategy, ChangeDetectorRef,
  ViewChild, ElementRef, NgZone,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject, map, takeUntil } from 'rxjs';
import { selectUsuario, selectUserRole } from '../../store/auth/auth.selectors';
import { Usuario } from '../auth/models';
import { MiniMapComponent } from './components/mini-map/mini-map';
import { DashboardService, DashboardData } from './services/dashboard.service';
import Chart from 'chart.js/auto';

@Component({
  selector:    'app-dashboard',
  standalone:  true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, RouterLink, DatePipe,
    MiniMapComponent,
  ],
  templateUrl: './dashboard.html',
  styleUrl:    './dashboard.css',
})
export class DashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  usuario$!:  Observable<Usuario | null>;
  userRole$!: Observable<string | null>;
  esAdmin$!:  Observable<boolean>;

  today = new Date();
  data: DashboardData | null = null;
  loading = true;

  @ViewChild('chartVentas') chartVentasRef?: ElementRef<HTMLCanvasElement>;
  private chartVentas?: Chart;

  private destroy$ = new Subject<void>();
  private viewInit = false;

  constructor(
    private store: Store,
    private svc: DashboardService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone,
  ) {}

  ngOnInit(): void {
    this.usuario$  = this.store.select(selectUsuario);
    this.userRole$ = this.store.select(selectUserRole);
    this.esAdmin$ = this.userRole$.pipe(
      map(rol => rol === 'SUPER_ADMIN' || rol === 'ADMIN'),
    );

    this.cargar();
  }

  ngAfterViewInit(): void {
    this.viewInit = true;
    if (this.data) this.dibujarGrafico();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.chartVentas?.destroy();
  }

  cargar(): void {
    this.loading = true;
    this.cdr.markForCheck();

    this.svc.getData().pipe(takeUntil(this.destroy$)).subscribe({
      next: d => {
        this.data = d;
        this.loading = false;
        this.cdr.markForCheck();
        if (this.viewInit) setTimeout(() => this.dibujarGrafico(), 50);
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  private dibujarGrafico(): void {
    if (!this.chartVentasRef?.nativeElement || !this.data?.ventas_7_dias) return;

    this.zone.runOutsideAngular(() => {
      this.chartVentas?.destroy();

      const ctx = this.chartVentasRef!.nativeElement.getContext('2d');
      if (!ctx) return;

      // Gradiente para el área
      const gradient = ctx.createLinearGradient(0, 0, 0, 200);
      gradient.addColorStop(0, 'rgba(225, 29, 72, 0.20)');
      gradient.addColorStop(1, 'rgba(225, 29, 72, 0)');

      this.chartVentas = new Chart(this.chartVentasRef!.nativeElement, {
        type: 'line',
        data: {
          labels: this.data!.ventas_7_dias.map(v => this.formatDiaCorto(v.fecha)),
          datasets: [{
            label: 'Ventas',
            data: this.data!.ventas_7_dias.map(v => v.total),
            borderColor: '#E11D48',
            backgroundColor: gradient,
            tension: 0.35,
            fill: true,
            pointRadius: 3,
            pointBackgroundColor: '#E11D48',
            pointBorderColor: '#FFFFFF',
            pointBorderWidth: 2,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: ctx => `Bs ${Number(ctx.parsed.y).toFixed(2)}`,
              },
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { font: { size: 10 }, color: '#94A3B8' },
              grid: { color: 'rgba(148, 163, 184, 0.1)' },
            },
            x: {
              ticks: { font: { size: 10 }, color: '#94A3B8' },
              grid: { display: false },
            },
          },
        },
      });
    });
  }

  // ═══════════════════════════════════════════════
  // HELPERS para template
  // ═══════════════════════════════════════════════

  fmtBs(n: number): string {
    return new Intl.NumberFormat('es-BO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n || 0);
  }

  fmtHoras(h: number): string {
    if (h === 0) return '—';
    const horas = Math.floor(h);
    const mins = Math.round((h - horas) * 60);
    return `${horas}h ${mins}m`;
  }

  iniciales(nombre: string): string {
    if (!nombre) return '?';
    const palabras = nombre.split(/\s+/).filter(Boolean);
    if (palabras.length === 1) return palabras[0].substring(0, 2).toUpperCase();
    return (palabras[0][0] + palabras[1][0]).toUpperCase();
  }

  colorAvatar(id: number): string {
    const colores = ['#7C3AED', '#E11D48', '#0891B2', '#D97706', '#059669', '#6366F1', '#EC4899'];
    return colores[id % colores.length];
  }

  /**
   * Devuelve config visual para el badge de estado
   */
  estadoConfig(estado: string): { bg: string; color: string; dot: string; label: string } {
    const map: Record<string, { bg: string; color: string; dot: string; label: string }> = {
      Borrador:           { bg: 'rgba(148,163,184,.12)', color: '#475569', dot: '#94A3B8', label: 'Borrador' },
      Confirmado:         { bg: 'rgba(8,145,178,.10)',   color: '#155E75', dot: '#0891B2', label: 'Confirmado' },
      Preparando:         { bg: 'rgba(124,58,237,.10)',  color: '#5B21B6', dot: '#7C3AED', label: 'Preparando' },
      Listo_Carga:        { bg: 'rgba(99,102,241,.10)',  color: '#3730A3', dot: '#6366F1', label: 'Listo carga' },
      En_Ruta:            { bg: 'rgba(217,119,6,.10)',   color: '#92400E', dot: '#D97706', label: 'En ruta' },
      Entregado_Total:    { bg: 'rgba(5,150,105,.10)',   color: '#065F46', dot: '#10B981', label: 'Entregado' },
      Entregado_Parcial:  { bg: 'rgba(132,204,22,.12)',  color: '#3F6212', dot: '#84CC16', label: 'Entregado parcial' },
      Cancelado:          { bg: 'rgba(220,38,38,.10)',   color: '#991B1B', dot: '#DC2626', label: 'Cancelado' },
      Devuelto:           { bg: 'rgba(236,72,153,.10)',  color: '#9D174D', dot: '#EC4899', label: 'Devuelto' },
    };
    return map[estado] || {
      bg: 'rgba(148,163,184,.12)', color: '#475569', dot: '#94A3B8', label: estado,
    };
  }

  /**
   * Formato corto para etiquetas de eje X (lun 10, mar 11, ...)
   */
  private formatDiaCorto(fechaStr: string): string {
    const [y, m, d] = fechaStr.split('-').map(Number);
    const fecha = new Date(y, m - 1, d);
    const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return `${dias[fecha.getDay()]} ${d}`;
  }
}