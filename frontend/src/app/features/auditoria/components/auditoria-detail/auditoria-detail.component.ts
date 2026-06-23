import {
  Component, Input, Output, EventEmitter,
  OnChanges, SimpleChanges,
  ChangeDetectionStrategy, ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuditoriaService, AuditoriaLogDetalle } from '../../services/auditoria.service';

@Component({
  selector: 'app-auditoria-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './auditoria-detail.component.html',
  styleUrl: './auditoria-detail.component.css',
})
export class AuditoriaDetailComponent implements OnChanges {
  @Input() logId: string | null = null;
  @Input() open = false;
  @Output() closed = new EventEmitter<void>();

  log: AuditoriaLogDetalle | null = null;
  loading = false;

  constructor(
    private svc: AuditoriaService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['logId'] && this.logId) {
      this.cargar();
    }
    if (changes['open'] && !this.open) {
      this.log = null;
    }
  }

  private cargar(): void {
    if (!this.logId) return;
    this.loading = true;
    this.log = null;
    this.cdr.markForCheck();

    this.svc.getOne(this.logId).subscribe({
      next: l => {
        this.log = l;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  cerrar(): void { this.closed.emit(); }

  formatJson(obj: any): string {
    if (!obj) return '';
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  }

  /**
   * Devuelve los pares [clave, valor] de un objeto JSON
   * para renderizarlos como filas comparativas.
   */
  getJsonRows(obj: any): Array<{ key: string; value: string }> {
    if (!obj || typeof obj !== 'object') return [];
    return Object.entries(obj).map(([key, value]) => ({
      key,
      value: typeof value === 'object' ? JSON.stringify(value) : String(value),
    }));
  }

  /**
   * Compara valor_anterior con valor_nuevo y retorna
   * un array unificado con todas las claves.
   */
  getComparacion(): Array<{
    key: string;
    anterior: string | null;
    nuevo: string | null;
    cambio: 'modificado' | 'agregado' | 'eliminado' | 'igual';
  }> {
    const anterior = this.log?.valor_anterior || {};
    const nuevo = this.log?.valor_nuevo || {};

    const allKeys = new Set([
      ...Object.keys(anterior),
      ...Object.keys(nuevo),
    ]);

    return Array.from(allKeys).sort().map(key => {
      const a = anterior[key];
      const n = nuevo[key];
      const aStr = a === undefined ? null : (typeof a === 'object' ? JSON.stringify(a) : String(a));
      const nStr = n === undefined ? null : (typeof n === 'object' ? JSON.stringify(n) : String(n));

      let cambio: 'modificado' | 'agregado' | 'eliminado' | 'igual';
      if (a === undefined)      cambio = 'agregado';
      else if (n === undefined) cambio = 'eliminado';
      else if (aStr !== nStr)   cambio = 'modificado';
      else                       cambio = 'igual';

      return { key, anterior: aStr, nuevo: nStr, cambio };
    });
  }

  get tieneCambios(): boolean {
    return !!(this.log?.valor_anterior || this.log?.valor_nuevo);
  }

  get esComparacion(): boolean {
    return !!(this.log?.valor_anterior && this.log?.valor_nuevo);
  }

  colorAccion(accion: string): string {
    const a = accion.toUpperCase();
    if (a.includes('CREAR') || a.includes('CREATE'))         return '#059669';
    if (a.includes('ACTUALIZAR') || a.includes('UPDATE') ||
        a.includes('EDITAR'))                                return '#0891B2';
    if (a.includes('ELIMINAR') || a.includes('DELETE'))      return '#DC2626';
    if (a.includes('LOGIN'))                                 return '#7C3AED';
    if (a.includes('LOGOUT'))                                return '#94A3B8';
    if (a.includes('RESTAURAR') || a.includes('RESTORE'))    return '#0EA5E9';
    return '#D97706';
  }
}