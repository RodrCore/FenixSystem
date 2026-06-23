import {
  Component, OnInit, OnDestroy,
  ChangeDetectionStrategy, ChangeDetectorRef,
} from '@angular/core';
import { CommonModule }       from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { Router }             from '@angular/router';
import {
  IonContent, IonInfiniteScroll, IonInfiniteScrollContent,
  IonRefresher, IonRefresherContent,
} from '@ionic/angular/standalone';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { VentasService }  from '../../core/services/ventas.service';
import { AuthService }    from '../../core/services/auth.service';
import { ClienteResumen } from '../../core/models/venta.model';
import { NavbarComponent } from '../../shared/components/navbar/navbar';
import { TabbarComponent } from '../../shared/components/tabbar/tabbar';
 
@Component({
  selector:    'app-clientes',
  standalone:  true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, ReactiveFormsModule,
    IonContent, IonInfiniteScroll, IonInfiniteScrollContent,
    IonRefresher, IonRefresherContent,
    NavbarComponent, TabbarComponent,
  ],
  templateUrl: './clientes.page.html',
  styleUrl:    './clientes.page.scss',
})
export class ClientesPage implements OnInit, OnDestroy {
  clientes:  ClienteResumen[] = [];
  loading  = true;
  page     = 1;
  totalPages = 1;
  buscarCtrl = new FormControl('');
  private destroy$ = new Subject<void>();
 
  constructor(
    private ventas:  VentasService,
    public  auth:    AuthService,
    private router:  Router,
    private cdr:     ChangeDetectorRef,
  ) {}
 
  ngOnInit(): void {
    this.load();
    this.buscarCtrl.valueChanges.pipe(
      debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$),
    ).subscribe(() => { this.page = 1; this.load(); });
  }
 
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
 
  // ── Permisos ──────────────────────────────────────────────
  get puedeAgregar(): boolean {
    return this.auth.hasRole(
      'SUPER_ADMIN', 'ADMIN', 'GERENTE', 'PREVENTISTA', 'REPARTIDOR'
    );
  }
 
  get puedeEditar(): boolean {
    return this.auth.hasRole(
      'SUPER_ADMIN', 'ADMIN', 'GERENTE', 'PREVENTISTA', 'REPARTIDOR'
    );
  }
 
  get puedeCambiarEstado(): boolean {
    return this.auth.hasRole('SUPER_ADMIN', 'ADMIN', 'GERENTE');
  }
 
  // ── Carga ─────────────────────────────────────────────────
  load(event?: any): void {
    if (!event) this.loading = true;
    this.ventas.getClientes({
      buscar: this.buscarCtrl.value ?? '',
      page:   this.page,
      limit:  20,
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: res => {
        this.clientes  = this.page === 1 ? res.data : [...this.clientes, ...res.data];
        this.totalPages = res.pages ?? Math.ceil(res.total / 20);
        this.loading   = false;
        event?.target?.complete();
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; event?.target?.complete(); this.cdr.markForCheck(); },
    });
  }
 
  refrescar(event: any): void { this.page = 1; this.load(event); }
 
  cargarMas(event: any): void {
    if (this.page >= this.totalPages) { event.target.complete(); return; }
    this.page++;
    this.load(event);
  }
 
  // ── Navegación ────────────────────────────────────────────
  verDetalle(id: number):  void { this.router.navigate(['/clientes', id]); }
  nuevoCliente():          void { this.router.navigate(['/clientes/nuevo']); }
 
  // ── Helpers ───────────────────────────────────────────────
  initials(nombre: string): string {
    return nombre.split(' ').slice(0, 2).map(w => w[0] ?? '').join('').toUpperCase();
  }
 
  get tieneDeuda() {
    return (c: ClienteResumen) => (c.saldo_pendiente ?? 0) > 0;
  }
}