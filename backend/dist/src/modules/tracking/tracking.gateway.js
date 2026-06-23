"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var TrackingGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrackingGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const common_1 = require("@nestjs/common");
const socket_io_1 = require("socket.io");
const jwt_1 = require("@nestjs/jwt");
let TrackingGateway = TrackingGateway_1 = class TrackingGateway {
    jwt;
    server;
    logger = new common_1.Logger(TrackingGateway_1.name);
    repartidoresActivos = new Map();
    constructor(jwt) {
        this.jwt = jwt;
    }
    async handleConnection(client) {
        try {
            const token = client.handshake.auth?.token ??
                client.handshake.headers?.authorization?.replace('Bearer ', '');
            if (!token) {
                this.logger.warn(`Conexión sin token: ${client.id}`);
                client.disconnect();
                return;
            }
            let payload;
            try {
                payload = this.jwt.verify(token);
            }
            catch (e) {
                client.disconnect();
                return;
            }
            client.data.user = {
                id: payload.sub,
                rol: payload.rol,
                nombres: payload.nombres,
            };
            const rolNombre = payload.rol;
            if (['SUPER_ADMIN', 'ADMIN', 'GERENTE'].includes(rolNombre)) {
                client.join('admins');
                this.logger.log(`Admin conectado: ${payload.nombres} (${client.id})`);
                client.emit('repartidores:snapshot', this.getRepartidoresActivos());
            }
            else {
                this.logger.log(`Usuario conectado: ${payload.nombres} (${client.id})`);
            }
        }
        catch (e) {
            this.logger.warn(`Token inválido: ${client.id}`);
            client.disconnect();
        }
    }
    async handleDisconnect(client) {
        const userId = client.data?.user?.id;
        if (userId && this.repartidoresActivos.has(userId)) {
            this.repartidoresActivos.delete(userId);
            this.server
                .to('admins')
                .emit('repartidor:offline', { repartidor_id: userId });
            this.logger.log(`Repartidor offline: ${userId}`);
        }
    }
    rutaIniciar(client, data) {
        const user = client.data.user;
        if (!user || user.rol !== 'REPARTIDOR')
            return;
        const activo = {
            repartidor_id: user.id,
            nombres: user.nombres,
            socket_id: client.id,
            lat: data.lat,
            lng: data.lng,
            ultima_actualizacion: new Date(),
            ruta_iniciada: true,
        };
        this.repartidoresActivos.set(user.id, activo);
        this.server.to('admins').emit('repartidor:online', activo);
        this.logger.log(`Repartidor ${user.nombres} inició ruta`);
    }
    actualizarUbicacion(client, data) {
        const user = client.data.user;
        if (!user || user.rol !== 'REPARTIDOR')
            return;
        const repartidor = this.repartidoresActivos.get(user.id);
        if (!repartidor) {
            this.rutaIniciar(client, data);
            return;
        }
        repartidor.lat = data.lat;
        repartidor.lng = data.lng;
        repartidor.ultima_actualizacion = new Date();
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
    rutaTerminar(client) {
        const user = client.data.user;
        if (!user)
            return;
        if (this.repartidoresActivos.has(user.id)) {
            this.repartidoresActivos.delete(user.id);
            this.server
                .to('admins')
                .emit('repartidor:offline', { repartidor_id: user.id });
            this.logger.log(`Repartidor ${user.nombres} terminó ruta`);
        }
    }
    getRepartidoresActivos() {
        return Array.from(this.repartidoresActivos.values());
    }
};
exports.TrackingGateway = TrackingGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], TrackingGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('ruta:iniciar'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], TrackingGateway.prototype, "rutaIniciar", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('ubicacion:actualizar'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], TrackingGateway.prototype, "actualizarUbicacion", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('ruta:terminar'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], TrackingGateway.prototype, "rutaTerminar", null);
exports.TrackingGateway = TrackingGateway = TrackingGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: { origin: '*' },
        namespace: 'tracking',
    }),
    __metadata("design:paramtypes", [jwt_1.JwtService])
], TrackingGateway);
//# sourceMappingURL=tracking.gateway.js.map