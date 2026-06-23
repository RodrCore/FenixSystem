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
  AlertController,
  ToastController,
  LoadingController,
} from '@ionic/angular/standalone';
import { Subject, takeUntil } from 'rxjs';
import { VentasService } from '../../core/services/ventas.service';
import { Pedido } from '../../core/models/venta.model';
import { NavbarComponent } from '../../shared/components/navbar/navbar';
import { EditarPedidoModalComponent } from './editar-pedido-modal.component';
import { AuthService } from '../../core/services/auth.service';

import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { FileOpener } from '@capacitor-community/file-opener';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-venta-detalle',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    IonContent,
    NavbarComponent,
    EditarPedidoModalComponent,
  ],
  templateUrl: './venta-detalle.page.html',
  styleUrl: './venta-detalle.page.scss',
})
export class VentaDetallePage implements OnInit, OnDestroy {
  pedido: Pedido | null = null;
  loading = true;
  mostrarEditar = false;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private ventas: VentasService,
    private router: Router,
    private alert: AlertController,
    private toast: ToastController,
    private loading2: LoadingController,
    private cdr: ChangeDetectorRef,
    private auth: AuthService,
    private http: HttpClient,
  ) {}
  get esAdmin(): boolean {
    return this.auth.hasRole('SUPER_ADMIN', 'ADMIN', 'GERENTE');
  }

  get esRepartidor(): boolean {
    return this.auth.hasRole('REPARTIDOR') && !this.esAdmin;
  }

  get esPreventista(): boolean {
    return this.auth.hasRole('PREVENTISTA') && !this.esAdmin;
  }

  get puedeEditarAsignacion(): boolean {
    if (!this.pedido) return false;
    const noEditables = [
      'Entregado_Total',
      'Entregado_Parcial',
      'Cancelado',
      'Devuelto',
    ];
    if (noEditables.includes(this.pedido.estado)) return false;

    if (this.esAdmin) return true;

    // ✅ Preventista puede editar SUS propias ventas
    if (this.esPreventista) {
      const userId = this.auth.getCurrentUser()?.id;
      return (this.pedido as any).preventista_id === userId;
    }

    return false;
  }

  get puedeMarcarEntregado(): boolean {
    if (!this.pedido) return false;

    const estado = this.pedido.estado;
    const repartidorIdPedido = (this.pedido as any).repartidor_id;
    const userId = this.auth.getCurrentUser()?.id;
    const esAdmin = this.esAdmin;
    const esRepartidor = this.esRepartidor;

    const estadosValidos = [
      'Confirmado',
      'Preparando',
      'Listo_Carga',
      'En_Ruta',
    ];
    if (!estadosValidos.includes(estado)) {
      return false;
    }
    if (esAdmin) return true;
    if (esRepartidor && repartidorIdPedido === userId) return true;

    return false;
  }

  get puedeConfirmarVenta(): boolean {
    if (!this.pedido) return false;
    // Solo admin/gerente puede cambiar de Borrador → Confirmado
    // Preventista NO ve este botón (el suyo se confirma automáticamente al crear)
    if (this.pedido.estado !== 'Borrador') return false;
    return this.esAdmin;
  }

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
      .getPedidoById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (p) => {
          this.pedido = p;
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.loading = false;
          this.cdr.markForCheck();
        },
      });
  }
  abrirEditar(): void {
    this.mostrarEditar = true;
    this.cdr.markForCheck();
  }
  onGuardado(): void {
    this.mostrarEditar = false;
    this.cargar(this.pedido!.id);
  }
  onCancelado(): void {
    this.mostrarEditar = false;
    this.cdr.markForCheck();
  }
  async cancelar(): Promise<void> {
    if (!this.pedido) return;

    const a = await this.alert.create({
      header: 'Cancelar venta',
      message: `¿Cancelar el pedido ${this.pedido.numero}? Esta acción quedará registrada.`,
      buttons: [
        { text: 'No', role: 'cancel' },
        {
          text: 'Sí, cancelar',
          role: 'destructive',
          handler: async () => {
            const loader = await this.loading2.create({
              message: 'Cancelando...',
            });
            await loader.present();
            this.ventas
              .cancelarPedido(this.pedido!.id)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: async () => {
                  await loader.dismiss();
                  const t = await this.toast.create({
                    message: 'Pedido cancelado',
                    duration: 2000,
                    position: 'bottom',
                    color: 'danger',
                  });
                  await t.present();
                  this.router.navigate(['/ventas']);
                },
                error: async () => {
                  await loader.dismiss();
                  const t = await this.toast.create({
                    message: 'Error al cancelar',
                    duration: 2000,
                    position: 'bottom',
                    color: 'danger',
                  });
                  await t.present();
                },
              });
          },
        },
      ],
      cssClass: 'fenix-alert',
    });
    await a.present();
  }
  async marcarDevolucion(): Promise<void> {
    if (!this.pedido) return;

    const a = await this.alert.create({
      header: 'Marcar devolución',
      message:
        `¿Confirmar devolución del pedido ${this.pedido.numero}? ` +
        `Esto reingresará el inventario al stock.`,
      inputs: [
        {
          name: 'motivo',
          type: 'textarea',
          placeholder: 'Motivo de la devolución (obligatorio)',
          attributes: { maxlength: 200 },
        },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Confirmar devolución',
          role: 'destructive',
          handler: async (data: any) => {
            if (!data.motivo?.trim()) {
              const t = await this.toast.create({
                message: 'Debes ingresar un motivo',
                duration: 2000,
                position: 'bottom',
                color: 'warning',
              });
              await t.present();
              return false;
            }

            const loader = await this.loading2.create({
              message: 'Procesando devolución...',
            });
            await loader.present();

            this.ventas
              .marcarDevolucion(this.pedido!.id, data.motivo)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: async () => {
                  await loader.dismiss();
                  const t = await this.toast.create({
                    message: 'Devolución registrada',
                    duration: 2000,
                    position: 'bottom',
                    color: 'success',
                  });
                  await t.present();
                  this.cargar(this.pedido!.id);
                },
                error: async (e: any) => {
                  await loader.dismiss();
                  const t = await this.toast.create({
                    message: e?.error?.message ?? 'Error al marcar devolución',
                    duration: 2500,
                    position: 'bottom',
                    color: 'danger',
                  });
                  await t.present();
                },
              });
            return true;
          },
        },
      ],
      cssClass: 'fenix-alert',
    });
    await a.present();
  }
  // Generar PDF — se conecta con BoletaPdfService (siguiente paso)
  async generarPDF(): Promise<void> {
    if (!this.pedido) return;

    const loader = await this.loading2.create({
      message: 'Generando boleta...',
    });
    await loader.present();

    try {
      const url = `${environment.apiUrl}/boletas/${this.pedido.id}`;
      const blob = await firstValueFrom(
        this.http.get(url, { responseType: 'blob' }),
      );

      const filename = `boleta-${this.pedido.numero}.pdf`;

      if (Capacitor.isNativePlatform()) {
        // En móvil: guardar el archivo y abrirlo con visor nativo
        const base64 = await this.blobToBase64(blob as Blob);
        const file = await Filesystem.writeFile({
          path: filename,
          data: base64,
          directory: Directory.Documents,
          recursive: true,
        });
        await FileOpener.open({
          filePath: file.uri,
          contentType: 'application/pdf',
        });
      } else {
        // En navegador: descargar
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob as Blob);
        link.download = filename;
        link.click();
      }

      await loader.dismiss();
      const t = await this.toast.create({
        message: 'Boleta descargada',
        duration: 2000,
        position: 'bottom',
        color: 'success',
      });
      await t.present();
    } catch (e: any) {
      await loader.dismiss();
      const t = await this.toast.create({
        message: e?.error?.message ?? 'Error al generar la boleta',
        duration: 2500,
        position: 'bottom',
        color: 'danger',
      });
      await t.present();
    }
  }

  // AGREGAR helper:
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  estadoColor(estado: string): string {
    const m: Record<string, string> = {
      Borrador: '#64748B',
      Confirmado: '#2563EB',
      Preparando: '#D97706',
      Listo_Carga: '#7C3AED',
      En_Ruta: '#0891B2',
      Entregado_Parcial: '#F59E0B',
      Entregado_Total: '#059669',
      Cancelado: '#DC2626',
      Devuelto: '#EF4444',
    };
    return m[estado] ?? '#64748B';
  }

  formatearEstado(estado: string): string {
    const m: Record<string, string> = {
      Borrador: 'Borrador',
      Confirmado: 'Confirmado',
      En_Preparacion: 'En Preparación',
      En_Ruta: 'En Ruta',
      Entregado: 'Entregado',
      Cancelado: 'Cancelado',
    };
    return m[estado] ?? estado;
  }

  get puedeEditar(): boolean {
    return ['Borrador', 'Confirmado', 'Preparando'].includes(
      this.pedido?.estado ?? '',
    );
  }
  get puedeCancelar(): boolean {
    if (!this.pedido) return false;
    const noCancelables = [
      'Entregado_Total',
      'Entregado_Parcial',
      'Cancelado',
      'Devuelto',
    ];
    if (noCancelables.includes(this.pedido.estado)) return false;

    // Admin: siempre
    if (this.esAdmin) return true;
    // Preventista: solo su propia venta y solo si está en Borrador o Confirmado
    if (this.esPreventista) {
      const esMia =
        (this.pedido as any).preventista_id === this.auth.getCurrentUser()?.id;
      return esMia && ['Borrador', 'Confirmado'].includes(this.pedido.estado);
    }
    // Repartidor: NO puede cancelar
    return false;
  }

  get puedeMarcarDevolucion(): boolean {
    if (!this.pedido) return false;

    // Solo se puede marcar devolución si ya fue entregado
    const estadosValidos = ['Entregado_Total', 'Entregado_Parcial'];
    if (!estadosValidos.includes(this.pedido.estado)) {
      return false;
    }

    // Admin siempre puede
    if (this.esAdmin) return true;

    // ✅ Repartidor SOLO puede marcar devolución de SUS propias entregas
    if (this.esRepartidor) {
      const userId = this.auth.getCurrentUser()?.id;
      const match = (this.pedido as any).repartidor_id === userId;
      return match;
    }

    return false;
  }

  get puedeGenerarBoleta(): boolean {
    if (!this.pedido) return false;
    // Repartidor NO puede generar boleta
    if (this.esRepartidor) return false;
    // Admin, gerente, preventista (de su propia venta) sí pueden
    if (this.esAdmin) return true;
    if (this.esPreventista) {
      return (
        (this.pedido as any).preventista_id === this.auth.getCurrentUser()?.id
      );
    }
    return false;
  }

  get subtotal(): number {
    return this.pedido?.detalles?.reduce((s, d) => s + d.subtotal, 0) ?? 0;
  }
  // AGREGAR método:
  async marcarEntregado(): Promise<void> {
    if (!this.pedido) return;

    const a = await this.alert.create({
      header: 'Marcar como entregado',
      message:
        `¿Confirmar entrega total del pedido ${this.pedido.numero}? ` +
        `Esto descontará el inventario.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Confirmar entrega',
          role: 'confirm',
          handler: async () => {
            const loader = await this.loading2.create({
              message: 'Procesando entrega...',
            });
            await loader.present();

            this.ventas
              .entregarPedido(this.pedido!.id)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: async () => {
                  await loader.dismiss();
                  const t = await this.toast.create({
                    message: 'Pedido entregado',
                    duration: 2000,
                    position: 'bottom',
                    color: 'success',
                  });
                  await t.present();
                  this.cargar(this.pedido!.id);
                },
                error: async (e: any) => {
                  await loader.dismiss();
                  const t = await this.toast.create({
                    message: e?.error?.message ?? 'Error al marcar entrega',
                    duration: 2500,
                    position: 'bottom',
                    color: 'danger',
                  });
                  await t.present();
                },
              });
          },
        },
      ],
      cssClass: 'fenix-alert',
    });
    await a.present();
  }

  // AGREGAR getter:
  get puedeEntregar(): boolean {
    if (!this.pedido) return false;
    // Solo se puede entregar si está Confirmado, Preparando, Listo_Carga o En_Ruta
    return ['Confirmado', 'Preparando', 'Listo_Carga', 'En_Ruta'].includes(
      this.pedido.estado,
    );
  }
}
