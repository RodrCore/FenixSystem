import {
  Component, OnInit, OnDestroy,
  ChangeDetectionStrategy, ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient }   from '@angular/common/http';
import { ToastController, LoadingController } from '@ionic/angular/standalone';
import { IonContent }   from '@ionic/angular/standalone';
import { Subject, takeUntil, firstValueFrom } from 'rxjs';
import { Capacitor }    from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { FileOpener }   from '@capacitor-community/file-opener';
import { AuthService }  from '../../core/services/auth.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar';
import { environment }  from '../../../environments/environment';
 
@Component({
  selector:    'app-reportes',
  standalone:  true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:     [CommonModule, IonContent, NavbarComponent],
  templateUrl: './reportes.page.html',
  styleUrl:    './reportes.page.scss',
})
export class ReportesPage implements OnInit, OnDestroy {
  meses = [
    { v: 1, n: 'Enero' },   { v: 2, n: 'Febrero' }, { v: 3, n: 'Marzo' },
    { v: 4, n: 'Abril' },   { v: 5, n: 'Mayo' },    { v: 6, n: 'Junio' },
    { v: 7, n: 'Julio' },   { v: 8, n: 'Agosto' },  { v: 9, n: 'Septiembre' },
    { v: 10, n: 'Octubre' },{ v: 11, n: 'Noviembre' },{ v: 12, n: 'Diciembre' },
  ];
 
  hoy        = new Date();
  mesActual  = this.hoy.getMonth() + 1;
  anioActual = this.hoy.getFullYear();
  anios:     number[] = [];
 
  data:  any  = null;
  loading = true;
 
  esPreventista = false;
  esRepartidor  = false;
 
  private destroy$ = new Subject<void>();
 
  constructor(
    private http:    HttpClient,
    private auth:    AuthService,
    private toast:   ToastController,
    private loader:  LoadingController,
    private cdr:     ChangeDetectorRef,
  ) {}
 
  ngOnInit(): void {
    // Lista de años: actual + 2 anteriores
    for (let i = 0; i < 3; i++) this.anios.push(this.anioActual - i);
 
    this.esPreventista = this.auth.hasRole('PREVENTISTA');
    this.esRepartidor  = this.auth.hasRole('REPARTIDOR');
 
    this.cargar();
  }
 
  ngOnDestroy(): void {
    this.destroy$.next(); this.destroy$.complete();
  }
 
  async cargar(): Promise<void> {
    this.loading = true;
    this.cdr.markForCheck();
 
    const endpoint = this.esPreventista ? 'preventista' : 'repartidor';
    const url = `${environment.apiUrl}/reportes/${endpoint}?mes=${this.mesActual}&anio=${this.anioActual}`;
 
    try {
      this.data = await firstValueFrom(this.http.get(url));
    } catch (e: any) {
      const t = await this.toast.create({
        message: 'Error al cargar el reporte',
        duration: 2000, color: 'danger', position: 'bottom',
      });
      await t.present();
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }
 
  cambiarMes(mes: number): void {
    this.mesActual = mes;
    this.cargar();
  }
 
  cambiarAnio(anio: number): void {
    this.anioActual = anio;
    this.cargar();
  }
 
  // ── DESCARGAR PDF ─────────────────────────────────────────
  async descargarPDF(): Promise<void> {
    const load = await this.loader.create({ message: 'Generando PDF...' });
    await load.present();
 
    try {
      const endpoint = this.esPreventista ? 'preventista' : 'repartidor';
      const url = `${environment.apiUrl}/reportes/${endpoint}/pdf?mes=${this.mesActual}&anio=${this.anioActual}`;
 
      // Descargar el PDF como blob
      const blob = await firstValueFrom(
        this.http.get(url, { responseType: 'blob' })
      );
 
      const filename = `reporte-${endpoint}-${this.mesActual}-${this.anioActual}.pdf`;
 
      if (Capacitor.isNativePlatform()) {
        // En móvil: guardar y abrir con visor de PDF nativo
        const base64 = await this.blobToBase64(blob as Blob);
        const file = await Filesystem.writeFile({
          path:      filename,
          data:      base64,
          directory: Directory.Documents,
          recursive: true,
        });
        await FileOpener.open({
          filePath:  file.uri,
          contentType: 'application/pdf',
        });
      } else {
        // En navegador: descargar
        const link = document.createElement('a');
        link.href     = URL.createObjectURL(blob as Blob);
        link.download = filename;
        link.click();
      }
 
      await load.dismiss();
      const t = await this.toast.create({
        message: 'Reporte descargado', duration: 2000,
        color: 'success', position: 'bottom',
      });
      await t.present();
 
    } catch (e: any) {
      await load.dismiss();
      const t = await this.toast.create({
        message: 'Error al generar PDF', duration: 2000,
        color: 'danger', position: 'bottom',
      });
      await t.present();
    }
  }
 
  // ── Helpers ───────────────────────────────────────────────
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
 
  nombreMes(m: number): string { return this.meses.find(x => x.v === m)?.n ?? ''; }
 
  estadoColor(estado: string): string {
    const m: Record<string, string> = {
      Borrador: '#64748B', Confirmado: '#2563EB',
      Preparando: '#D97706', Listo_Carga: '#7C3AED',
      En_Ruta: '#0891B2',
      Entregado_Total: '#059669', Entregado_Parcial: '#F59E0B',
      Cancelado: '#DC2626', Devuelto: '#EF4444',
    };
    return m[estado] ?? '#64748B';
  }
 
  estadosConDatos(): { key: string; data: any }[] {
    if (!this.data?.por_estado) return [];
    return Object.entries(this.data.por_estado)
      .filter(([_, v]: any) => v.cantidad > 0)
      .map(([key, data]) => ({ key, data }));
  }
}
