import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
interface UbicacionPayload {
    lat: number;
    lng: number;
    velocidad?: number;
    pedido_id?: number;
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
export declare class TrackingGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private jwt;
    server: Server;
    private readonly logger;
    private repartidoresActivos;
    constructor(jwt: JwtService);
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): Promise<void>;
    rutaIniciar(client: Socket, data: UbicacionPayload): void;
    actualizarUbicacion(client: Socket, data: UbicacionPayload): void;
    rutaTerminar(client: Socket): void;
    getRepartidoresActivos(): RepartidorActivo[];
}
export {};
