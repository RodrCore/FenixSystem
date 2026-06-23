import { Component, Input } from '@angular/core';
import { CommonModule }     from '@angular/common';
import { Router }           from '@angular/router';
import {
  IonHeader, IonToolbar, IonButtons, IonButton,
  AlertController,
} from '@ionic/angular/standalone';
import { AuthService }  from '../../../core/services/auth.service';
import { CartService }  from '../../../core/services/cart.service';
import { PerfilService } from '../../../core/services/perfil.service';
import { Subject, takeUntil } from 'rxjs';
import { OnInit, OnDestroy } from '@angular/core';
 
@Component({
  selector:   'app-navbar',
  standalone: true,
  imports:    [CommonModule, IonHeader, IonToolbar, IonButtons, IonButton],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class NavbarComponent implements OnInit, OnDestroy{
  @Input() titulo       = 'FenixBd';
  @Input() mostrarPerfil = false;
  @Input() mostrarBack   = false;

  avatarUrl:    string | null = null;
  iniciales:    string = '';
  nombreCorto:  string = '';
  private destroy$ = new Subject<void>();
 
  constructor(
    private alertController: AlertController,
    private router:  Router,
    private auth:    AuthService,
    private cart:    CartService,
    private alertCtrl: AlertController,
    private perfilSrv: PerfilService,
  ) {}

  ngOnInit(): void {
    // Cargar avatar e iniciales del usuario logueado
    const usuario = this.auth.getCurrentUser();
    if (usuario) {
      this.avatarUrl   = this.perfilSrv.urlCompleta(usuario.avatar_url);
      this.iniciales   = this.calcularIniciales(usuario);
      this.nombreCorto = usuario.nombres ?? '';
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next(); this.destroy$.complete();
  }

  irAPerfil(): void {
    this.router.navigate(['/perfil']);
  }

  private calcularIniciales(u: any): string {
    const n = u.nombres?.[0] ?? '';
    const a = u.apellido_paterno?.[0] ?? '';
    return (n + a).toUpperCase();
  }

  get initials(): string {
    const u = this.auth.getCurrentUser();
    return (u?.nombres ?? '').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }
 
  goBack(): void { window.history.back(); }
 
  async confirmarLogout(): Promise<void> {
    const a = await this.alertCtrl.create({
      header:  'Cerrar sesión',
      message: '¿Estás seguro que deseas salir?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Salir', role: 'destructive',
          handler: async () => {
            this.cart.limpiar();
            await this.auth.logout();
            this.router.navigate(['/login']);
          },
        },
      ],
      cssClass: 'fenix-alert',
    });
    await a.present();
  }
}