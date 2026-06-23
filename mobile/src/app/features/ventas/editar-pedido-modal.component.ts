import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ToastController, LoadingController } from '@ionic/angular/standalone';
import { VentasService } from '../../core/services/ventas.service';
import { Pedido, Vehiculo, Usuario } from '../../core/models/venta.model';

@Component({
  selector: 'app-editar-pedido-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './editar-pedido-modal.component.html',
  styleUrl: './editar-pedido-modal.component.scss',
})
export class EditarPedidoModalComponent implements OnInit {
  @Input() pedido!: Pedido;
  @Output() guardado = new EventEmitter<Pedido>();
  @Output() cancelado = new EventEmitter<void>();

  vehiculos: Vehiculo[] = [];
  repartidores: Usuario[] = [];
  vehiculoSel: Vehiculo | null = null;
  repartidorSel: Usuario | null = null;
  guardando = false;

  constructor(
    private ventas: VentasService,
    private toast: ToastController,
    private loader: LoadingController,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    // Cargar vehículos y repartidores
    this.ventas.getVehiculos().subscribe((vs) => {
      this.vehiculos = vs;
      this.vehiculoSel =
        vs.find((v) => v.id === this.pedido.vehiculo_id) ?? null;
      this.cdr.markForCheck();
    });
    this.ventas.getRepartidores().subscribe((rs) => {
      this.repartidores = rs;
      this.repartidorSel =
        rs.find((r) => r.id === (this.pedido as any).repartidor_id) ?? null;
      this.cdr.markForCheck();
    });
  }

  setVehiculo(v: Vehiculo | null): void {
    this.vehiculoSel = v;
    this.cdr.markForCheck();
  }
  setRepartidor(r: Usuario | null): void {
    this.repartidorSel = r;
    this.cdr.markForCheck();
  }

  async guardar(): Promise<void> {
    const load = await this.loader.create({ message: 'Guardando cambios...' });
    await load.present();
    this.guardando = true;

    try {
      // 1. Actualizar vehículo si cambió
      if (this.vehiculoSel?.id !== this.pedido.vehiculo_id) {
        await this.ventas
          .editarPedido(this.pedido.id, {
            vehiculo_id: this.vehiculoSel?.id ?? null,
          })
          .toPromise();
      }

      // 2. Asignar/desasignar repartidor
      if (this.repartidorSel?.id !== (this.pedido as any).repartidor_id) {
        await this.ventas
          .asignarRepartidor(this.pedido.id, this.repartidorSel?.id ?? null)
          .toPromise();
      }

      await load.dismiss();
      const t = await this.toast.create({
        message: 'Pedido actualizado',
        duration: 2000,
        position: 'bottom',
        color: 'success',
      });
      await t.present();
      this.guardado.emit(this.pedido);
    } catch (e: any) {
      await load.dismiss();
      const t = await this.toast.create({
        message: e?.error?.message ?? 'Error al guardar',
        duration: 2500,
        position: 'bottom',
        color: 'danger',
      });
      await t.present();
      this.guardando = false;
      this.cdr.markForCheck();
    }
  }

  cerrar(): void {
    this.cancelado.emit();
  }
}
