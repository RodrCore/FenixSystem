import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { App, BackButtonListenerEvent } from '@capacitor/app';
import { AlertController, NavController } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';   
import { TemaService } from './core/services/tema.service';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  private listenerRegistrado = false;
  private confirmandoSalida  = false;
  private readonly rutasRaiz = [
    '/dashboard',
    '/productos',
    '/clientes',
    '/ventas',
    '/repartidor/entregas',
    '/usuarios',
    '/reportes',
  ];

  constructor(
    private alert: AlertController,
    private nav: NavController,
    private router: Router,
    private tema: TemaService,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.tema.inicializar();
    if (!Capacitor.isNativePlatform()) return;

    // ✅ Ocultar splash screen con un pequeño delay para que se vea el logo
    setTimeout(async () => {
      await SplashScreen.hide({ fadeOutDuration: 300 });
    }, 1500);

    if (this.listenerRegistrado) return;
    this.listenerRegistrado = true;

    await App.removeAllListeners();

    App.addListener('backButton', (ev: BackButtonListenerEvent) => {
      this.handleBackButton(ev);
    });
  }

  private async handleBackButton(ev: BackButtonListenerEvent): Promise<void> {
    if (this.confirmandoSalida) return;

    const url = this.router.url;

    if (url === '/login') return;

    if (url === '/dashboard' || url.startsWith('/dashboard?')) {
      this.confirmandoSalida = true;

      const a = await this.alert.create({
        header:  '¿Salir de la aplicación?',
        message: 'Se cerrará la aplicación pero tu sesión se mantendrá activa.',
        buttons: [
          {
            text: 'Cancelar', role: 'cancel',
            handler: () => { this.confirmandoSalida = false; },
          },
          {
            text: 'Salir', role: 'destructive',
            handler: () => {
              this.confirmandoSalida = false;
              App.exitApp();
            },
          },
        ],
        cssClass: 'fenix-alert',
      });
      await a.present();
      a.onDidDismiss().then(() => { this.confirmandoSalida = false; });
      return;
    }

    if (ev.canGoBack) {
      this.nav.back();
    } else {
      this.nav.navigateRoot('/dashboard');
    }
  }
}