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
  selector: 'app-tab-inventario',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, KpiCardComponent],
  templateUrl: './tab-inventario.component.html',
  styleUrl: './tab-inventario.component.css',
})
export class TabInventarioComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input() filtro!: ReporteFiltro;
  @ViewChild('chartCategorias') chartCatRef?: ElementRef<HTMLCanvasElement>;

  data: any = null;
  loading = true;
  private chartCat?: Chart;
  private destroy$ = new Subject<void>();
  private viewInit = false;

  constructor(private svc: ReportesService, private cdr: ChangeDetectorRef, private zone: NgZone) {}

  ngOnChanges(c: SimpleChanges): void { if (c['filtro']) this.cargar(); }
  ngAfterViewInit(): void { this.viewInit = true; if (this.data) this.dibujar(); }
  ngOnDestroy(): void {
    this.destroy$.next(); this.destroy$.complete();
    this.chartCat?.destroy();
  }

  private cargar(): void {
    this.loading = true; this.cdr.markForCheck();
    this.svc.getInventario(this.filtro).pipe(takeUntil(this.destroy$)).subscribe({
      next: d => {
        this.data = d; this.loading = false; this.cdr.markForCheck();
        if (this.viewInit) setTimeout(() => this.dibujar(), 50);
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); },
    });
  }

  private dibujar(): void {
    this.zone.runOutsideAngular(() => this.dibujarCategorias());
  }

  private dibujarCategorias(): void {
    if (!this.chartCatRef?.nativeElement || !this.data?.por_categoria) return;
    this.chartCat?.destroy();
    const colores = ['#E11D48', '#7C3AED', '#0891B2', '#D97706', '#059669', '#6366F1', '#EC4899', '#84CC16'];
    this.chartCat = new Chart(this.chartCatRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: this.data.por_categoria.map((c: any) => c.categoria),
        datasets: [{
          data: this.data.por_categoria.map((c: any) => c.cantidad_productos),
          backgroundColor: colores,
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

  diasColor(dias: number): string {
    if (dias <= 7) return '#DC2626';
    if (dias <= 15) return '#D97706';
    return '#0891B2';
  }
}