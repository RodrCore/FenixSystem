import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  AlertController,
  ToastController,
  LoadingController,
  ActionSheetController,
} from '@ionic/angular/standalone';
import { Subject, takeUntil } from 'rxjs';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { AuthService } from '../../core/services/auth.service';
import {
  PerfilService,
  PerfilUsuario,
} from '../../core/services/perfil.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar';
import { TemaService, ModoTema } from '../../core/services/tema.service';

type TabPerfil = 'perfil' | 'seguridad' | 'sesion';

@Component({
  selector: 'app-perfil',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, IonContent, NavbarComponent],
  templateUrl: './perfil.page.html',
  styleUrl: './perfil.page.scss',
})
export class PerfilPage implements OnInit, OnDestroy {
  perfil: PerfilUsuario | null = null;
  tab: TabPerfil = 'perfil';
  loading = true;

  // ── Formulario datos personales ────────────────────────────
  form = {
    nombres: '',
    apellido_paterno: '',
    apellido_materno: '',
    email: '',
    telefono: '',
  };
  guardandoDatos = false;

  // ── Formulario cambio de contraseña ────────────────────────
  pwd = {
    actual: '',
    nueva: '',
    confirmacion: '',
  };
  mostrarActual = false;
  mostrarNueva = false;
  mostrarConfirm = false;
  guardandoPwd = false;

  private destroy$ = new Subject<void>();

  constructor(
    private perfilSrv: PerfilService,
    private auth: AuthService,
    private router: Router,
    private alert: AlertController,
    private toast: ToastController,
    private loader: LoadingController,
    private actionSht: ActionSheetController,
    private cdr: ChangeDetectorRef,
    public tema: TemaService
  ) {}

  ngOnInit(): void {
    this.cargar();
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Cargar datos del perfil ────────────────────────────────
  cargar(): void {
    this.loading = true;
    this.perfilSrv
      .getMi()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (p) => {
          this.perfil = p;
          this.form = {
            nombres: p.nombres,
            apellido_paterno: p.apellido_paterno ?? '',
            apellido_materno: p.apellido_materno ?? '',
            email: p.email,
            telefono: p.telefono ?? '',
          };
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.loading = false;
          this.cdr.markForCheck();
        },
      });
  }

  // ── Cambiar tab ────────────────────────────────────────────
  cambiarTab(t: TabPerfil): void {
    this.tab = t;
    this.cdr.markForCheck();
  }
  get temaActual(): ModoTema {
    return this.tema.getModo();
  }
  // ── Iniciales del usuario (para avatar fallback) ───────────
  get iniciales(): string {
    if (!this.perfil) return '';
    const n = this.perfil.nombres?.[0] ?? '';
    const a = this.perfil.apellido_paterno?.[0] ?? '';
    return (n + a).toUpperCase();
  }

  get nombreCompleto(): string {
    if (!this.perfil) return '';
    return [
      this.perfil.nombres,
      this.perfil.apellido_paterno,
      this.perfil.apellido_materno,
    ]
      .filter(Boolean)
      .join(' ');
  }

  get avatarUrl(): string | null {
    return this.perfilSrv.urlCompleta(this.perfil?.avatar_url);
  }
  async cambiarTema(modo: ModoTema): Promise<void> {
    await this.tema.cambiarTema(modo);
    this.cdr.markForCheck();
  }
  // ════════════════════════════════════════════════════════════
  // FOTO DE PERFIL
  // ════════════════════════════════════════════════════════════
  async cambiarFoto(): Promise<void> {
    const sheet = await this.actionSht.create({
      header: 'Foto de perfil',
      buttons: [
        {
          text: 'Tomar foto',
          icon: 'camera',
          handler: () => this.tomarFoto(CameraSource.Camera),
        },
        {
          text: 'Elegir de galería',
          icon: 'image',
          handler: () => this.tomarFoto(CameraSource.Photos),
        },
        {
          text: 'Eliminar foto',
          icon: 'trash',
          role: 'destructive',
          handler: () => this.eliminarFoto(),
        },
        { text: 'Cancelar', icon: 'close', role: 'cancel' },
      ],
    });
    await sheet.present();
  }

  private async tomarFoto(source: CameraSource): Promise<void> {
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.Base64,
        source,
        quality: 80,
        width: 600,
        height: 600,
        allowEditing: true,
        promptLabelHeader: 'Foto de perfil',
        promptLabelPhoto: 'Galería',
        promptLabelPicture: 'Cámara',
      });

      if (!photo.base64String) return;

      const load = await this.loader.create({ message: 'Subiendo foto...' });
      await load.present();

      // Convertir base64 a Blob
      const blob = this.base64ToBlob(
        photo.base64String,
        `image/${photo.format}`
      );

      this.perfilSrv
        .subirAvatar(blob, `avatar.${photo.format}`)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: async (actualizado) => {
            this.perfil = { ...this.perfil!, ...actualizado };
            await load.dismiss();
            const t = await this.toast.create({
              message: 'Foto actualizada',
              duration: 2000,
              color: 'success',
              position: 'bottom',
            });
            await t.present();
            this.cdr.markForCheck();
          },
          error: async (e: any) => {
            await load.dismiss();
            const t = await this.toast.create({
              message: e?.error?.message ?? 'Error al subir foto',
              duration: 2500,
              color: 'danger',
              position: 'bottom',
            });
            await t.present();
          },
        });
    } catch (e: any) {
      // Usuario canceló o no concedió permiso
      if (e?.message?.includes('cancelled')) return;
      const t = await this.toast.create({
        message: 'No se pudo acceder a la cámara',
        duration: 2000,
        color: 'warning',
        position: 'bottom',
      });
      await t.present();
    }
  }

  private async eliminarFoto(): Promise<void> {
    if (!this.perfil?.avatar_url) return;
    const load = await this.loader.create({ message: 'Eliminando...' });
    await load.present();

    this.perfilSrv
      .eliminarAvatar()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: async () => {
          this.perfil = { ...this.perfil!, avatar_url: undefined };
          await load.dismiss();
          this.cdr.markForCheck();
        },
        error: async () => {
          await load.dismiss();
        },
      });
  }

  // ════════════════════════════════════════════════════════════
  // GUARDAR DATOS PERSONALES
  // ════════════════════════════════════════════════════════════
  async guardarDatos(): Promise<void> {
    if (this.guardandoDatos) return;

    if (!this.form.nombres?.trim() || !this.form.email?.trim()) {
      const t = await this.toast.create({
        message: 'Nombre y email son obligatorios',
        duration: 2000,
        color: 'warning',
        position: 'bottom',
      });
      await t.present();
      return;
    }

    this.guardandoDatos = true;
    const load = await this.loader.create({ message: 'Guardando...' });
    await load.present();

    this.perfilSrv
      .actualizar(this.form)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: async (actualizado) => {
          this.perfil = { ...this.perfil!, ...actualizado };
          this.auth.actualizarUsuarioEnMemoria(actualizado);
          await load.dismiss();
          this.guardandoDatos = false;
          const t = await this.toast.create({
            message: 'Datos actualizados',
            duration: 2000,
            color: 'success',
            position: 'bottom',
          });
          await t.present();
          this.cdr.markForCheck();
        },
        error: async (e: any) => {
          await load.dismiss();
          this.guardandoDatos = false;
          const t = await this.toast.create({
            message: e?.error?.message ?? 'Error al guardar',
            duration: 2500,
            color: 'danger',
            position: 'bottom',
          });
          await t.present();
          this.cdr.markForCheck();
        },
      });
  }

  // ════════════════════════════════════════════════════════════
  // CAMBIAR CONTRASEÑA
  // ════════════════════════════════════════════════════════════
  async guardarPassword(): Promise<void> {
    if (this.guardandoPwd) return;

    // Validaciones
    if (!this.pwd.actual || !this.pwd.nueva || !this.pwd.confirmacion) {
      const t = await this.toast.create({
        message: 'Completa todos los campos',
        duration: 2000,
        color: 'warning',
        position: 'bottom',
      });
      await t.present();
      return;
    }

    if (this.pwd.nueva.length < 8) {
      const t = await this.toast.create({
        message: 'La nueva contraseña debe tener al menos 8 caracteres',
        duration: 2500,
        color: 'warning',
        position: 'bottom',
      });
      await t.present();
      return;
    }

    if (this.pwd.nueva !== this.pwd.confirmacion) {
      const t = await this.toast.create({
        message: 'La confirmación no coincide',
        duration: 2000,
        color: 'warning',
        position: 'bottom',
      });
      await t.present();
      return;
    }

    this.guardandoPwd = true;
    const load = await this.loader.create({ message: 'Actualizando...' });
    await load.present();

    this.perfilSrv
      .cambiarPassword(this.pwd.actual, this.pwd.nueva)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: async () => {
          await load.dismiss();
          this.guardandoPwd = false;
          this.pwd = { actual: '', nueva: '', confirmacion: '' };
          const t = await this.toast.create({
            message: 'Contraseña actualizada',
            duration: 2000,
            color: 'success',
            position: 'bottom',
          });
          await t.present();
          this.cdr.markForCheck();
        },
        error: async (e: any) => {
          await load.dismiss();
          this.guardandoPwd = false;
          const t = await this.toast.create({
            message: e?.error?.message ?? 'Error al cambiar contraseña',
            duration: 2500,
            color: 'danger',
            position: 'bottom',
          });
          await t.present();
          this.cdr.markForCheck();
        },
      });
  }

  // ════════════════════════════════════════════════════════════
  // CERRAR SESIONES REMOTAS
  // ════════════════════════════════════════════════════════════
  async cerrarOtrasSesiones(): Promise<void> {
    const a = await this.alert.create({
      header: 'Cerrar otras sesiones',
      message:
        '¿Cerrar sesión en todos los demás dispositivos? Tu sesión actual se mantiene.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Cerrar',
          role: 'destructive',
          handler: () => {
            this.perfilSrv
              .cerrarSesionesRemotas()
              .pipe(takeUntil(this.destroy$))
              .subscribe(async () => {
                const t = await this.toast.create({
                  message: 'Otras sesiones cerradas',
                  duration: 2000,
                  color: 'success',
                  position: 'bottom',
                });
                await t.present();
              });
          },
        },
      ],
    });
    await a.present();
  }

  // ════════════════════════════════════════════════════════════
  // LOGOUT
  // ════════════════════════════════════════════════════════════
  async cerrarSesion(): Promise<void> {
    const a = await this.alert.create({
      header: '¿Cerrar sesión?',
      message: 'Tendrás que iniciar sesión nuevamente.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Cerrar sesión',
          role: 'destructive',
          handler: () => {
            this.auth.logout();
            this.router.navigateByUrl('/login');
          },
        },
      ],
    });
    await a.present();
  }

  // ── Helpers ────────────────────────────────────────────────
  private base64ToBlob(base64: string, mimeType: string): Blob {
    const byteChars = atob(base64);
    const bytes = new Uint8Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) {
      bytes[i] = byteChars.charCodeAt(i);
    }
    return new Blob([bytes], { type: mimeType });
  }
}
