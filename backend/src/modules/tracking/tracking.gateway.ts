import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

interface UbicacionPayload {
  lat: number;
  lng: number;
  velocidad?: number; // km/h opcional
  pedido_id?: number; // pedido actual hacia el que va
}

interface RepartidorActivo {
  repartidor_id: number;
  nombres: string;
  socket_id: string;
  lat: number;
  lng: number;
  ultima_actualizacion: Date;
  ruta_iniciada: boolean;
}

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: 'tracking',
})
export class TrackingGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(TrackingGateway.name);

  // ── Estado en memoria de repartidores con ruta activa ─────
  // Map<repartidor_id, RepartidorActivo>
  private repartidoresActivos = new Map<number, RepartidorActivo>();

  constructor(private jwt: JwtService) {}

  // ── Auth en conexión ──────────────────────────────────────
  async handleConnection(client: Socket): Promise<void> {
    try {
      const token =
        client.handshake.auth?.token ??
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn(`Conexión sin token: ${client.id}`);
        client.disconnect();
        return;
      }
      let payload: any;
      try {
        payload = this.jwt.verify(token);
      } catch (e: any) {
        client.disconnect();
        return;
      }
      //const payload: any = this.jwt.verify(token);
      client.data.user = {
        id: payload.sub,
        rol: payload.rol,
        nombres: payload.nombres,
      };

      // Si es admin → unirlo a la sala "admins" para recibir broadcasts
      const rolNombre = payload.rol;

      if (['SUPER_ADMIN', 'ADMIN', 'GERENTE'].includes(rolNombre)) {
        client.join('admins');

        this.logger.log(`Admin conectado: ${payload.nombres} (${client.id})`);

        // Enviar al recién conectado el estado actual de los repartidores activos
        client.emit('repartidores:snapshot', this.getRepartidoresActivos());
      } else {
        this.logger.log(`Usuario conectado: ${payload.nombres} (${client.id})`);
      }
    } catch (e: any) {
      this.logger.warn(`Token inválido: ${client.id}`);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket): Promise<void> {
    const userId = client.data?.user?.id;
    if (userId && this.repartidoresActivos.has(userId)) {
      // Si era un repartidor con ruta activa, marcar como offline
      this.repartidoresActivos.delete(userId);
      this.server
        .to('admins')
        .emit('repartidor:offline', { repartidor_id: userId });
      this.logger.log(`Repartidor offline: ${userId}`);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // EVENTOS QUE EL REPARTIDOR EMITE
  // ═══════════════════════════════════════════════════════════

  // ── Repartidor inicia ruta ────────────────────────────────
  @SubscribeMessage('ruta:iniciar')
  rutaIniciar(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: UbicacionPayload,
  ): void {
    const user = client.data.user;
    if (!user || user.rol !== 'REPARTIDOR') return;

    const activo: RepartidorActivo = {
      repartidor_id: user.id,
      nombres: user.nombres,
      socket_id: client.id,
      lat: data.lat,
      lng: data.lng,
      ultima_actualizacion: new Date(),
      ruta_iniciada: true,
    };
    this.repartidoresActivos.set(user.id, activo);

    // Notificar a todos los admins que este repartidor inició ruta
    this.server.to('admins').emit('repartidor:online', activo);
    this.logger.log(`Repartidor ${user.nombres} inició ruta`);
  }

  // ── Repartidor actualiza ubicación (cada 30 seg) ──────────
  @SubscribeMessage('ubicacion:actualizar')
  actualizarUbicacion(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: UbicacionPayload,
  ): void {
    const user = client.data.user;
    if (!user || user.rol !== 'REPARTIDOR') return;

    const repartidor = this.repartidoresActivos.get(user.id);
    if (!repartidor) {
      // Iniciar implícitamente si no estaba registrado
      this.rutaIniciar(client, data);
      return;
    }

    repartidor.lat = data.lat;
    repartidor.lng = data.lng;
    repartidor.ultima_actualizacion = new Date();

    // Broadcast a admins
    this.server.to('admins').emit('repartidor:move', {
      repartidor_id: user.id,
      nombres: user.nombres,
      lat: data.lat,
      lng: data.lng,
      velocidad: data.velocidad,
      pedido_id: data.pedido_id,
      ultima_actualizacion: repartidor.ultima_actualizacion,
    });
  }

  // ── Repartidor termina ruta ───────────────────────────────
  @SubscribeMessage('ruta:terminar')
  rutaTerminar(@ConnectedSocket() client: Socket): void {
    const user = client.data.user;
    if (!user) return;

    if (this.repartidoresActivos.has(user.id)) {
      this.repartidoresActivos.delete(user.id);
      this.server
        .to('admins')
        .emit('repartidor:offline', { repartidor_id: user.id });
      this.logger.log(`Repartidor ${user.nombres} terminó ruta`);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // CONSULTAS
  // ═══════════════════════════════════════════════════════════

  // Para devolver snapshot a admin recién conectado
  getRepartidoresActivos(): RepartidorActivo[] {
    return Array.from(this.repartidoresActivos.values());
  }
}
