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
  selector: 'app-tab-comercial',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, KpiCardComponent],
  templateUrl: './tab-comercial.component.html',
  styleUrl: './tab-comercial.component.css',
})
export class TabComercialComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input() filtro!: ReporteFiltro;
  @ViewChild('chartPreventistas') chartPrevRef?: ElementRef<HTMLCanvasElement>;

  data: any = null;
  loading = true;
  private chartPrev?: Chart;
  private destroy$ = new Subject<void>();
  private viewInit = false;

  constructor(private svc: ReportesService, private cdr: ChangeDetectorRef, private zone: NgZone) {}

  ngOnChanges(c: SimpleChanges): void { if (c['filtro']) this.cargar(); }
  ngAfterViewInit(): void { this.viewInit = true; if (this.data) this.dibujar(); }
  ngOnDestroy(): void {
    this.destroy$.next(); this.destroy$.complete();
    this.chartPrev?.destroy();
  }

  private cargar(): void {
    this.loading = true; this.cdr.markForCheck();
    this.svc.getComercial(this.filtro).pipe(takeUntil(this.destroy$)).subscribe({
      next: d => {
        this.data = d; this.loading = false; this.cdr.markForCheck();
        if (this.viewInit) setTimeout(() => this.dibujar(), 50);
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); },
    });
  }

  private dibujar(): void {
    this.zone.runOutsideAngular(() => this.dibujarPreventistas());
  }

  private dibujarPreventistas(): void {
    if (!this.chartPrevRef?.nativeElement || !this.data?.preventistas) return;
    this.chartPrev?.destroy();
    const top = this.data.preventistas.slice(0, 10);
    this.chartPrev = new Chart(this.chartPrevRef.nativeElement, {
      type: 'bar',
      data: {
        labels: top.map((p: any) => p.nombre.split(' ').slice(0, 2).join(' ')),
        datasets: [{
          label: 'Ventas (Bs)',
          data: top.map((p: any) => p.total_vendido),
          backgroundColor: '#D97706',
          borderRadius: 6,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false, indexAxis: 'y',
        plugins: { legend: { display: false } },
        scales: { x: { beginAtZero: true } },
      },
    });
  }

  fmtBs(n: number): string {
    return new Intl.NumberFormat('es-BO', { minimumFractionDigits: 2 }).format(n || 0);
  }

  rankClass(i: number): string {
    if (i === 0) return '';
    if (i === 1) return 'rank-2';
    if (i === 2) return 'rank-3';
    return 'rank-n';
  }
}