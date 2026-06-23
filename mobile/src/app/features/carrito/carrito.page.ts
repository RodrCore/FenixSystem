import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  AlertController,
  ToastController,
  LoadingController,
} from '@ionic/angular/standalone';
import { Subject, takeUntil } from 'rxjs';
import { CartService } from '../../core/services/cart.service';
import { VentasService } from '../../core/services/ventas.service';
import { CartItem } from '../../core/models/venta.model';
import { NavbarComponent } from '../../shared/components/navbar/navbar';

@Component({
  selector: 'app-carrito',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, IonContent, NavbarComponent],
  templateUrl: './carrito.page.html',
  styleUrl: './carrito.page.scss',
})
export class CarritoPage implements OnInit, OnDestroy {
  items: CartItem[] = [];
  notas = '';
  descuento = 0;
  guardando = false;
  private destroy$ = new Subject<void>();

  constructor(
    public cart: CartService,
    private ventas: VentasService,
    private router: Router,
    private alert: AlertController,
    private toast: ToastController,
    private loading: LoadingController,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cart.items.pipe(takeUntil(this.destroy$)).subscribe((items) => {
      this.items = items;
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Controles de cantidad ──────────────────────────────────
  incrementar(item: CartItem): void {
    this.cart.setCantidad(
      item.producto.id,
      item.presentacion.id,
      item.cantidad + 1,
    );
  }

  decrementar(item: CartItem): void {
    if (item.cantidad <= 1) {
      this.confirmarEliminar(item);
      return;
    }
    this.cart.setCantidad(
      item.producto.id,
      item.presentacion.id,
      item.cantidad - 1,
    );
  }

  async confirmarEliminar(item: CartItem): Promise<void> {
    const a = await this.alert.create({
      header: 'Quitar producto',
      message: `¿Quitar "${item.producto.nombre}" del carrito?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Quitar',
          role: 'destructive',
          handler: () =>
            this.cart.quitar(item.producto.id, item.presentacion.id),
        },
      ],
      cssClass: 'fenix-alert',
    });
    await a.present();
  }

  // ── Totales ───────────────────────────────────────────────
  get subtotal(): number {
    return this.cart.subtotal;
  }
  get total(): number {
    return Math.max(0, this.subtotal - this.descuento);
  }

  // ── Confirmar venta ───────────────────────────────────────
  async confirmarVenta(): Promise<void> {
    if (!this.items.length) return;

    const clienteId = this.cart.getClienteId();
    if (!clienteId) {
      await this.mostrarToast(
        'Selecciona un cliente antes de confirmar',
        'warning',
      );
      this.router.navigate(['/clientes']);
      return;
    }

    const loader = await this.loading.create({ message: 'Guardando venta...' });
    await loader.present();

    this.ventas
      .crearPedido({
        cliente_id: clienteId,
        detalles: this.items.map((i) => ({
          producto_id: i.producto.id,
          presentacion_id: i.presentacion.id,
          cantidad: i.cantidad,
          precio_unitario: i.precio_unit,
        })),
        subtotal: this.subtotal,
        descuento: this.descuento,
        total: this.total,
        notas: this.notas || undefined,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: async (pedido) => {
          await loader.dismiss();
          this.cart.limpiar();
          await this.mostrarToast('Venta confirmada exitosamente', 'success');
          this.router.navigate(['/ventas/detalle', pedido.id]);
        },
        error: async () => {
          await loader.dismiss();
          await this.mostrarToast('Error al guardar la venta', 'danger');
        },
      });
  }

  private async mostrarToast(msg: string, color: string): Promise<void> {
    const t = await this.toast.create({
      message: msg,
      duration: 2500,
      position: 'bottom',
      color,
    });
    await t.present();
  }
}
