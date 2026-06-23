import { Injectable }      from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CartItem, ProductoResumen, PresentacionResumen } from '../models/venta.model';
 
@Injectable({ providedIn: 'root' })
export class CartService {
  private items$ = new BehaviorSubject<CartItem[]>([]);
  private clienteId$ = new BehaviorSubject<number | null>(null);
 
  // ── Observables públicos ───────────────────────────────────
  items     = this.items$.asObservable();
  clienteId = this.clienteId$.asObservable();
 
  // ── Getters ───────────────────────────────────────────────
  getItems():     CartItem[] { return this.items$.getValue(); }
  getClienteId(): number | null { return this.clienteId$.getValue(); }
 
  get count(): number {
    return this.getItems().reduce((s, i) => s + i.cantidad, 0);
  }
 
  get subtotal(): number {
    return this.getItems().reduce((s, i) => s + i.total, 0);
  }
 
  // ── Asignar cliente ────────────────────────────────────────
  setCliente(id: number): void {
    this.clienteId$.next(id);
  }
 
  // ── Agregar producto ───────────────────────────────────────
  agregar(producto: ProductoResumen, presentacion: PresentacionResumen, cantidad = 1): void {
    const items = [...this.getItems()];
    const idx   = items.findIndex(
      i => i.producto.id === producto.id && i.presentacion.id === presentacion.id
    );
 
    if (idx >= 0) {
      items[idx] = {
        ...items[idx],
        cantidad: items[idx].cantidad + cantidad,
        total:    (items[idx].cantidad + cantidad) * items[idx].precio_unit,
      };
    } else {
      items.push({
        producto,
        presentacion,
        cantidad,
        precio_unit: presentacion.precio_venta,
        total:       cantidad * presentacion.precio_venta,
      });
    }
 
    this.items$.next(items);
  }
 
  // ── Cambiar cantidad ──────────────────────────────────────
  setCantidad(productoId: number, presentacionId: number, cantidad: number): void {
    if (cantidad <= 0) {
      this.quitar(productoId, presentacionId);
      return;
    }
    const items = this.getItems().map(i =>
      i.producto.id === productoId && i.presentacion.id === presentacionId
        ? { ...i, cantidad, total: cantidad * i.precio_unit }
        : i
    );
    this.items$.next(items);
  }
 
  // ── Quitar producto ────────────────────────────────────────
  quitar(productoId: number, presentacionId: number): void {
    this.items$.next(
      this.getItems().filter(
        i => !(i.producto.id === productoId && i.presentacion.id === presentacionId)
      )
    );
  }
 
  // ── Limpiar carrito ────────────────────────────────────────
  limpiar(): void {
    this.items$.next([]);
    this.clienteId$.next(null);
  }
}