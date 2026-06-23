import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { NavigationBar } from '@capgo/capacitor-navigation-bar';

export type ModoTema = 'claro' | 'oscuro' | 'sistema';

@Injectable({ providedIn: 'root' })
export class TemaService {
  private _modo$ = new BehaviorSubject<ModoTema>('sistema');
  modo$ = this._modo$.asObservable();

  async inicializar(): Promise<void> {
    // Leer preferencia guardada
    const { value } = await Preferences.get({ key: 'tema' });
    const modo: ModoTema = (value as ModoTema) ?? 'sistema';
    this._modo$.next(modo);
    this.aplicarTema(modo);

    // Escuchar cambios del sistema operativo (solo si está en "sistema")
    if (window.matchMedia) {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      media.addEventListener('change', () => {
        if (this._modo$.value === 'sistema') {
          this.aplicarTema('sistema');
        }
      });
    }
  }

  async cambiarTema(modo: ModoTema): Promise<void> {
    this._modo$.next(modo);
    this.aplicarTema(modo);
    await Preferences.set({ key: 'tema', value: modo });
  }

  private async aplicarTema(modo: ModoTema): Promise<void> {
    let oscuro = false;

    if (modo === 'oscuro') {
      oscuro = true;
    } else if (modo === 'claro') {
      oscuro = false;
    } else {
      oscuro =
        window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
    }

    // Aplicar clase al html
    if (oscuro) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // ✅ Cambiar status bar y navigation bar en nativo
    if (Capacitor.isNativePlatform()) {
      try {
        if (oscuro) {
          // Status bar (arriba) en oscuro
          await StatusBar.setStyle({ style: Style.Dark });
          await StatusBar.setBackgroundColor({ color: '#1E293B' });

          // Navigation bar (abajo) en oscuro
          await NavigationBar.setNavigationBarColor({
            color: '#1E293B',
            darkButtons: false, // iconos blancos
          });
        } else {
          // Status bar (arriba) en claro
          await StatusBar.setStyle({ style: Style.Light });
          await StatusBar.setBackgroundColor({ color: '#FFFFFF' });

          // Navigation bar (abajo) en claro
          await NavigationBar.setNavigationBarColor({
            color: '#FFFFFF',
            darkButtons: true, // iconos negros
          });
        }
      } catch (e) {
        console.warn('No se pudo cambiar status/navigation bar:', e);
      }
    }
  }

  getModo(): ModoTema {
    return this._modo$.value;
  }
}
