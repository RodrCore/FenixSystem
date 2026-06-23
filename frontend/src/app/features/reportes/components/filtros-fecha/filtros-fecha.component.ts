import {
  Component, Input, Output, EventEmitter, OnInit,
  ChangeDetectionStrategy, ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReporteFiltro, Periodo } from '../../services/reportes.service';

@Component({
  selector: 'app-filtros-fecha',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  templateUrl: './filtros-fecha.component.html',
  styleUrl: './filtros-fecha.component.css',
})
export class FiltrosFechaComponent implements OnInit {
  @Input() filtro: ReporteFiltro = { periodo: 'mes' };
  @Output() filtroChange = new EventEmitter<ReporteFiltro>();

  desdeStr = '';
  hastaStr = '';

  readonly opciones: { v: Periodo; n: string }[] = [
    { v: 'hoy',    n: 'Hoy' },
    { v: 'semana', n: 'Esta semana' },
    { v: 'mes',    n: 'Este mes' },
    { v: 'anio',   n: 'Este año' },
    { v: 'custom', n: 'Personalizado' },
  ];

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    if (this.filtro.desde) this.desdeStr = this.filtro.desde;
    if (this.filtro.hasta) this.hastaStr = this.filtro.hasta;
    if (!this.filtro.periodo) this.filtro.periodo = 'mes';
  }

  seleccionar(p: Periodo): void {
    this.filtro = { ...this.filtro, periodo: p };
    if (p !== 'custom') {
      // Limpiar fechas custom
      this.desdeStr = '';
      this.hastaStr = '';
      this.filtro.desde = undefined;
      this.filtro.hasta = undefined;
    }
    this.emitir();
  }

  onFechaChange(): void {
    if (this.desdeStr && this.hastaStr) {
      this.filtro = {
        ...this.filtro,
        periodo: 'custom',
        desde: this.desdeStr,
        hasta: this.hastaStr,
      };
      this.emitir();
    }
  }

  private emitir(): void {
    this.filtroChange.emit({ ...this.filtro });
    this.cdr.markForCheck();
  }

  get esCustom(): boolean {
    return this.filtro.periodo === 'custom';
  }
}