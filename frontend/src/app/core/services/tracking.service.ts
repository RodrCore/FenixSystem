import { Injectable, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, Subject } from 'rxjs';
import { AuthService } from '../../features/auth/services/auth.service';
import { environment } from '../../../environments/environment';

export interface RepartidorActivo {
  repartidor_id: number;
  nombres: string;
  lat: number;
  lng: number;
  velocidad?: number;
  pedido_id?: number;
  ultima_actualizacion: Date | string;
}

@Injectable({ providedIn: 'root' })
export class TrackingService implements OnDestroy {
  private socket: Socket | null = null;

  // Lista completa de repartidores conectados
  private _repartidores$ = new BehaviorSubject<Map<number, RepartidorActivo>>(new Map());
  repartidores$ = this._repartidores$.asObservable();

  // Eventos individuales para reaccionar (mover pin, etc.)
  private _move$ = new Subject<RepartidorActivo>();
  private _online$ = new Subject<RepartidorActivo>();
  private _offline$ = new Subject<{ repartidor_id: number }>();

  onMove$ = this._move$.asObservable();
  onOnline$ = this._online$.asObservable();
  onOffline$ = this._offline$.asObservable();

  constructor(private auth: AuthService) {
    this.conectar();
  }

  // ── Conectar al servidor de tracking ──────────────────────
  conectar(): void {
    if (this.socket?.connected) {
      return;
    }

    const token = this.auth.getAccessToken();

    if (!token) {
      return;
    }

    const wsUrl = environment.apiUrl.replace(/\/api\/?$/, '');

    this.socket = io(`${wsUrl}/tracking`, {
      path: '/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 2000,
    });

    // Snapshot inicial al conectar
    this.socket.on('repartidores:snapshot', (lista: RepartidorActivo[]) => {
      const map = new Map<number, RepartidorActivo>();
      lista.forEach((r) => map.set(r.repartidor_id, r));
      this._repartidores$.next(map);
    });

    // Repartidor nuevo se conecta
    this.socket.on('repartidor:online', (rep: RepartidorActivo) => {
      const map = new Map(this._repartidores$.value);
      map.set(rep.repartidor_id, rep);
      this._repartidores$.next(map);
      this._online$.next(rep);
    });

    // Repartidor mueve su pin
    this.socket.on('repartidor:move', (rep: RepartidorActivo) => {
      const map = new Map(this._repartidores$.value);
      map.set(rep.repartidor_id, rep);
      this._repartidores$.next(map);
      this._move$.next(rep);
    });

    // Repartidor termina ruta
    this.socket.on('repartidor:offline', ({ repartidor_id }: any) => {
      const map = new Map(this._repartidores$.value);
      map.delete(repartidor_id);
      this._repartidores$.next(map);
      this._offline$.next({ repartidor_id });
    });
    this.socket.on('connect', () => {});

    this.socket.on('connect_error', (err) => {
      console.error('🟥 connect_error:', err.message);
      if (err.message.includes('expired') || err.message.includes('jwt')) {
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('🟧 disconnect:', reason);
    });
    // Después de los socket.on existentes:
    this.socket.onAny((event, ...args) => {});
  }

  desconectar(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  ngOnDestroy(): void {
    this.desconectar();
  }
}
