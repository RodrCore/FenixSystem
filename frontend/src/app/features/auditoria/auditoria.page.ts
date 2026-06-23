import {
  Component, OnInit, OnDestroy,
  ChangeDetectionStrategy, ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

import {
  AuditoriaService,
  AuditoriaLog,
  AuditoriaStats,
  AuditoriaFiltros,
} from './services/auditoria.service';
import { AuditoriaDetailComponent } from './components/auditoria-detail/auditoria-detail.component';

@Component({
  selector: 'app-auditoria',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, AuditoriaDetailComponent],
  templateUrl: './auditoria.page.html',
  styleUrl: './auditoria.page.css',
})
export class AuditoriaPage implements OnInit, OnDestroy {
  logs: AuditoriaLog[] = [];
  stats: AuditoriaStats = {
    total_periodo: 0,
    acciones_hoy: 0,
    usuarios_activos_hoy: 0,
    modulo_mas_activo: '—',
    modulo_mas_activo_count: 0,
  };
  filtrosOpciones: AuditoriaFiltros = { modulos: [], acciones: [], usuarios: [] };

  total = 0;
  page = 1;
  limit = 25;
  pages = 1;
  loading = true;
  exporting = false;

  filterForm!: FormGroup;
  verTodo = false;

  detalleAbierto = false;
  logDetalleId: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private svc: AuditoriaService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      buscar: [''],
      usuario_id: [''],
      modulo: [''],
      accion: [''],
      ip: [''],
      desde: [''],
      hasta: [''],
    });

    this.filterForm.get('buscar')!.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => { this.page = 1; this.load(); });

    this.filterForm.get('ip')!.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => { this.page = 1; this.load(); });

    this.loadFiltrosOpciones();
    this.loadStats();
    this.load();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  load(): void {
    this.loading = true;
    const query = this.buildQuery();
    query.page = this.page;
    query.limit = this.limit;

    this.svc.getAll(query).pipe(takeUntil(this.destroy$)).subscribe({
      next: res => {
        this.logs = res.data;
        this.total = res.total;
        this.pages = res.pages;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  loadStats(): void {
    this.svc.getStats().pipe(takeUntil(this.destroy$)).subscribe({
      next: s => {
        this.stats = s;
        this.cdr.markForCheck();
      },
    });
  }

  loadFiltrosOpciones(): void {
    this.svc.getFiltrosOpciones().pipe(takeUntil(this.destroy$)).subscribe({
      next: f => {
        this.filtrosOpciones = f;
        this.cdr.markForCheck();
      },
    });
  }

  private buildQuery(): any {
    const f = this.filterForm.value;
    const query: any = {};
    if (f.buscar?.trim()) query.buscar = f.buscar.trim();
    if (f.usuario_id)     query.usuario_id = f.usuario_id;
    if (f.modulo)         query.modulo = f.modulo;
    if (f.accion)         query.accion = f.accion;
    if (f.ip?.trim())     query.ip = f.ip.trim();
    if (f.desde)          query.desde = f.desde;
    if (f.hasta)          query.hasta = f.hasta;
    if (this.verTodo)     query.ver_todo = true;
    return query;
  }

  onFilterChange(): void { this.page = 1; this.load(); }

  toggleVerTodo(): void {
    this.verTodo = !this.verTodo;
    this.page = 1;
    this.load();
  }

  limpiarFiltros(): void {
    this.filterForm.reset({
      buscar: '', usuario_id: '', modulo: '', accion: '', ip: '', desde: '', hasta: '',
    });
    this.verTodo = false;
    this.page = 1;
    this.load();
  }

  get hayFiltrosActivos(): boolean {
    const f = this.filterForm.value;
    return !!(
      f.buscar || f.usuario_id || f.modulo || f.accion ||
      f.ip || f.desde || f.hasta || this.verTodo
    );
  }

  goPage(p: number): void {
    if (p < 1 || p > this.pages) return;
    this.page = p;
    this.load();
  }

  get pageNumbers(): number[] {
    const t = this.pages, c = this.page;
    if (t <= 7) return Array.from({ length: t }, (_, i) => i + 1);
    if (c <= 4) return [1, 2, 3, 4, 5, -1, t];
    if (c >= t - 3) return [1, -1, t - 4, t - 3, t - 2, t - 1, t];
    return [1, -1, c - 1, c, c + 1, -1, t];
  }

  get desde(): number { return (this.page - 1) * this.limit + 1; }
  get hasta(): number { return Math.min(this.page * this.limit, this.total); }

  verDetalle(log: AuditoriaLog): void {
    this.logDetalleId = log.id;
    this.detalleAbierto = true;
    this.cdr.markForCheck();
  }

  cerrarDetalle(): void {
    this.detalleAbierto = false;
    this.cdr.markForCheck();
  }

  exportar(): void {
    this.exporting = true;
    this.cdr.markForCheck();

    this.svc.exportExcel(this.buildQuery()).pipe(takeUntil(this.destroy$)).subscribe({
      next: blob => {
        this.exporting = false;
        this.cdr.markForCheck();

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const fecha = new Date().toISOString().slice(0, 10);
        a.href = url;
        a.download = `auditoria_${fecha}.xlsx`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      },
      error: e => {
        this.exporting = false;
        this.cdr.markForCheck();
        alert(e?.error?.message || 'Error al exportar');
      },
    });
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

  iniciales(nombre: string): string {
    if (!nombre) return '?';
    const palabras = nombre.split(/\s+/).filter(Boolean);
    if (palabras.length === 1) return palabras[0].substring(0, 2).toUpperCase();
    return (palabras[0][0] + palabras[1][0]).toUpperCase();
  }

  colorPorId(id: number): string {
    const colores = ['#7C3AED', '#E11D48', '#0891B2', '#D97706', '#059669', '#6366F1', '#EC4899'];
    return colores[id % colores.length];
  }

  colorRol(rol: string): string {
    const m: Record<string, string> = {
      SUPER_ADMIN: '#7C3AED',
      ADMIN: '#E11D48',
      GERENTE: '#0891B2',
      PREVENTISTA: '#D97706',
      REPARTIDOR: '#059669',
      ALMACEN: '#6366F1',
    };
    return m[rol] || '#64748B';
  }
}