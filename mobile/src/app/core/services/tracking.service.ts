import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

// Plugin de background-geolocation
interface BackgroundGeolocationPlugin {
  addWatcher(
    options: {
      backgroundMessage?: string;
      backgroundTitle?: string;
      requestPermissions?: boolean;
      stale?: boolean;
      distanceFilter?: number;
    },
    callback: (
      position?: {
        latitude: number;
        longitude: number;
        accuracy: number;
        speed: number | null;
        time: number | null;
      },
      error?: any
    ) => void
  ): Promise<string>;

  removeWatcher(options: { id: string }): Promise<void>;
  openSettings(): Promise<void>;
}

const BackgroundGeolocation = registerPlugin<BackgroundGeolocationPlugin>(
  'BackgroundGeolocation'
);

export interface UbicacionActualizada {
  lat: number;
  lng: number;
  velocidad?: number;
}

@Injectable({ providedIn: 'root' })
export class TrackingService implements OnDestroy {
  private socket: Socket | null = null;
  private watchId: string | null = null;

  // Estado público observable
  private _rutaActiva$ = new BehaviorSubject<boolean>(false);
  rutaActiva$ = this._rutaActiva$.asObservable();

  private _miUbicacion$ = new Subject<UbicacionActualizada>();
  miUbicacion$ = this._miUbicacion$.asObservable();

  ultimaUbicacion: UbicacionActualizada | null = null;

  constructor(private auth: AuthService) {}

  // ════════════════════════════════════════════════════════
  // INICIAR RUTA
  // ════════════════════════════════════════════════════════
  async iniciarRuta(): Promise<void> {
    if (this._rutaActiva$.value) return;

    // 1) Conectar el socket primero
    await this.conectar();

    // 2) Obtener la ubicación inicial y emitirla
    //    (esto también dispara el diálogo de permisos)
    await new Promise<void>((resolve, reject) => {
      this.iniciarWatcher(
        (ubicacion) => {
          // Primera vez: emitir ruta:iniciar al backend
          if (!this._rutaActiva$.value) {
            this.socket?.emit('ruta:iniciar', ubicacion);
            this._rutaActiva$.next(true);
            resolve();
          }
        },
        (err) => reject(err)
      );
    });
  }

  // ════════════════════════════════════════════════════════
  // TERMINAR RUTA
  // ════════════════════════════════════════════════════════
  async terminarRuta(): Promise<void> {
    if (!this._rutaActiva$.value) return;

    if (this.socket?.connected) {
      this.socket.emit('ruta:terminar');
    }

    await this.detenerWatcher();
    this.desconectar();
    this._rutaActiva$.next(false);
    this.ultimaUbicacion = null;
  }

  // ════════════════════════════════════════════════════════
  // WATCHER DE UBICACIÓN
  // ════════════════════════════════════════════════════════
  private async iniciarWatcher(
    onUpdate: (ubicacion: UbicacionActualizada) => void,
    onError?: (err: any) => void
  ): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      // En web (browser): usar la API estándar
      if (!navigator.geolocation) {
        onError?.(new Error('GPS no disponible'));
        return;
      }
      navigator.geolocation.watchPosition(
        (pos) => {
          const ubicacion: UbicacionActualizada = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            velocidad: pos.coords.speed ? pos.coords.speed * 3.6 : undefined,
          };
          this.procesarUbicacion(ubicacion, onUpdate);
        },
        (err) => onError?.(err),
        { enableHighAccuracy: true, maximumAge: 5000 }
      );
      return;
    }

    // En móvil nativo: background-geolocation
    try {
      this.watchId = await BackgroundGeolocation.addWatcher(
        {
          backgroundMessage: 'FenixBd está rastreando tu ruta de entregas',
          backgroundTitle: 'Ruta activa',
          requestPermissions: true,
          stale: false,
          distanceFilter: 10, // metros entre actualizaciones
        },
        (position, error) => {
          if (error) {
            console.error('Tracking error:', error);
            if (error.code === 'NOT_AUTHORIZED') {
              BackgroundGeolocation.openSettings();
            }
            onError?.(error);
            return;
          }
          if (!position) return;

          const ubicacion: UbicacionActualizada = {
            lat: position.latitude,
            lng: position.longitude,
            velocidad: position.speed ? position.speed * 3.6 : undefined,
          };
          this.procesarUbicacion(ubicacion, onUpdate);
        }
      );
    } catch (e) {
      onError?.(e);
    }
  }

  private procesarUbicacion(
    ubicacion: UbicacionActualizada,
    onFirst: (u: UbicacionActualizada) => void
  ): void {
    const esPrimera = this.ultimaUbicacion === null;
    this.ultimaUbicacion = ubicacion;

    // Emitir al observable (para el mapa local)
    this._miUbicacion$.next(ubicacion);

    if (esPrimera) {
      onFirst(ubicacion);
    } else if (this.socket?.connected) {
      // Enviar al backend (lo verán los admins en el dashboard)
      this.socket.emit('ubicacion:actualizar', ubicacion);
    }
  }

  private async detenerWatcher(): Promise<void> {
    if (!this.watchId) return;
    try {
      if (Capacitor.isNativePlatform()) {
        await BackgroundGeolocation.removeWatcher({ id: this.watchId });
      }
    } catch (e) {
      console.warn('Error deteniendo watcher:', e);
    }
    this.watchId = null;
  }

  // ════════════════════════════════════════════════════════
  // SOCKET.IO
  // ════════════════════════════════════════════════════════
  private async conectar(): Promise<void> {
    if (this.socket?.connected) return;

    const token = this.auth.getTokenValue();
    if (!token) throw new Error('No hay sesión activa');

    const wsUrl = environment.apiUrl.replace(/\/api\/?$/, '');

    return new Promise((resolve, reject) => {
      this.socket = io(`${wsUrl}/tracking`, {
        path: '/socket.io',
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 2000,
        reconnectionAttempts: 10,
        extraHeaders: {
          'ngrok-skip-browser-warning': 'true',
        },
      });

      this.socket.on('connect', () => {
        console.log('[Tracking] Socket conectado');
        resolve();
      });

      this.socket.on('connect_error', (err: any) => {
        console.error('[Tracking] connect_error:', err.message);
        reject(err);
      });

      // ✅ Cuando reconecta tras desconexión, re-anunciar la ruta
      this.socket.on('reconnect', () => {
        console.log('[Tracking] Socket reconectado');
        if (this._rutaActiva$.value && this.ultimaUbicacion) {
          this.socket?.emit('ruta:iniciar', this.ultimaUbicacion);
        }
      });

      this.socket.on('disconnect', (reason: string) => {
        console.warn('[Tracking] Socket desconectado:', reason);
      });
    });
  }

  private desconectar(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  ngOnDestroy(): void {
    this.terminarRuta();
  }
}
