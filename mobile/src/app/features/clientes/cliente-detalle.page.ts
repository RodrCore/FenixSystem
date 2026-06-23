import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent,
  ToastController,
  AlertController,
} from '@ionic/angular/standalone';
import { Subject, takeUntil } from 'rxjs';
import { VentasService } from '../../core/services/ventas.service';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { ClienteResumen } from '../../core/models/venta.model';
import { NavbarComponent } from '../../shared/components/navbar/navbar';

@Component({
  selector: 'app-cliente-detalle',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, IonContent, NavbarComponent],
  templateUrl: './cliente-detalle.page.html',
  styleUrl: './cliente-detalle.page.scss',
})
export class ClienteDetallePage implements OnInit, OnDestroy {
  cliente: any | null = null;
  loading = true;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private ventas: VentasService,
    private cart: CartService,
    public auth: AuthService,
    private router: Router,
    private toast: ToastController,
    private alertCtrl: AlertController,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.cargar(id);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargar(id: number): void {
    this.ventas
      .getClienteById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (c) => {
          this.cliente = c;
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.loading = false;
          this.cdr.markForCheck();
        },
      });
  }

  // ── Permisos ──────────────────────────────────────────────
  get puedeEditar(): boolean {
    return this.auth.hasRole(
      'SUPER_ADMIN',
      'ADMIN',
      'GERENTE',
      'PREVENTISTA',
      'REPARTIDOR',
    );
  }

  get puedeCambiarEstado(): boolean {
    return this.auth.hasRole('SUPER_ADMIN', 'ADMIN', 'GERENTE');
  }

  // ── Acciones ──────────────────────────────────────────────
  editar(): void {
    this.router.navigate(['/clientes', this.cliente.id, 'editar']);
  }

  async cambiarEstado(): Promise<void> {
    if (!this.cliente) return;
    const nuevoEstado =
      this.cliente.estado === 'Activo' ? 'Inactivo' : 'Activo';
    const a = await this.alertCtrl.create({
      header: `${nuevoEstado === 'Inactivo' ? 'Desactivar' : 'Activar'} cliente`,
      message: `¿${nuevoEstado === 'Inactivo' ? 'Desactivar' : 'Activar'} a "${this.cliente.razon_social}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: nuevoEstado === 'Inactivo' ? 'Desactivar' : 'Activar',
          handler: () => {
            this.ventas
              .cambiarEstadoCliente(this.cliente.id, nuevoEstado)
              .pipe(takeUntil(this.destroy$))
              .subscribe(async () => {
                this.cliente = { ...this.cliente, estado: nuevoEstado };
                const t = await this.toast.create({
                  message: `Cliente ${nuevoEstado === 'Activo' ? 'activado' : 'desactivado'}`,
                  duration: 1500,
                  position: 'bottom',
                  color: nuevoEstado === 'Activo' ? 'success' : 'warning',
                });
                await t.present();
                this.cdr.markForCheck();
              });
          },
        },
      ],
      cssClass: 'fenix-alert',
    });
    await a.present();
  }

  async iniciarVenta(): Promise<void> {
    if (!this.cliente) return;
    this.cart.setCliente(this.cliente.id);
    const t = await this.toast.create({
      message: `Cliente: ${this.cliente.razon_social}`,
      duration: 1200,
      position: 'bottom',
      color: 'dark',
    });
    await t.present();
    this.router.navigate(['/ventas/nueva']);
  }

  llamar(): void {
    if (this.cliente?.contacto_telefono)
      window.open(`tel:${this.cliente.contacto_telefono}`);
  }

  whatsapp(): void {
    const num =
      this.cliente?.contacto_whatsapp ?? this.cliente?.contacto_telefono;
    if (num) window.open(`https://wa.me/${num.replace(/\D/g, '')}`);
  }

  get initials(): string {
    return (this.cliente?.razon_social ?? '')
      .split(' ')
      .slice(0, 2)
      .map((w: string) => w[0])
      .join('')
      .toUpperCase();
  }

  get direccionCompleta(): string {
    const c = this.cliente;
    if (!c) return '';
    return [
      c.direccion_calle,
      c.direccion_numero,
      c.direccion_colonia,
      c.direccion_ciudad,
    ]
      .filter(Boolean)
      .join(', ');
  }

  get tieneDeuda(): boolean {
    return (this.cliente?.saldo_pendiente ?? 0) > 0;
  }
  estadoColor(estado: string): string {
    const m: Record<string, string> = {
      Borrador: '#64748B',
      Confirmado: '#2563EB',
      En_Preparacion: '#D97706',
      En_Ruta: '#7C3AED',
      Entregado: '#059669',
      Cancelado: '#DC2626',
    };
    return m[estado] ?? '#64748B';
  }
}
