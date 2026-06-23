"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var OsrmService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OsrmService = void 0;
const common_1 = require("@nestjs/common");
let OsrmService = OsrmService_1 = class OsrmService {
    logger = new common_1.Logger(OsrmService_1.name);
    OSRM_URL = process.env.OSRM_URL ?? 'http://localhost:5000';
    async optimizarRuta(origen, paradas) {
        if (!paradas.length) {
            throw new common_1.BadRequestException('Sin paradas para optimizar');
        }
        const puntos = [origen, ...paradas]
            .map(p => `${p.lng},${p.lat}`)
            .join(';');
        const url = `${this.OSRM_URL}/trip/v1/driving/${puntos}` +
            `?source=first&roundtrip=false&overview=full&geometries=geojson`;
        try {
            const res = await fetch(url);
            if (!res.ok) {
                const err = await res.text();
                throw new common_1.BadRequestException(`OSRM error: ${err}`);
            }
            const data = await res.json();
            if (data.code !== 'Ok' || !data.trips?.length) {
                throw new common_1.BadRequestException(`OSRM no pudo calcular la ruta: ${data.code}`);
            }
            const trip = data.trips[0];
            const orden = data.waypoints
                .slice(1)
                .map((w, i) => ({
                input_idx: i,
                output_order: w.waypoint_index,
            }))
                .sort((a, b) => a.output_order - b.output_order)
                .map((x) => x.input_idx);
            return {
                orden,
                distancia_metros: trip.distance,
                duracion_segundos: trip.duration,
                geometria: trip.geometry,
                distancia_texto: this.formatearDistancia(trip.distance),
                duracion_texto: this.formatearDuracion(trip.duration),
            };
        }
        catch (e) {
            if (e instanceof Error) {
                this.logger.error(`optimizarRuta: ${e.message}`);
                if (e.message.includes('fetch failed') || e.message.includes('ECONNREFUSED')) {
                    throw new common_1.BadRequestException('No se puede conectar al servidor OSRM. ¿Está corriendo en ' + this.OSRM_URL + '?');
                }
            }
            throw e;
        }
    }
    async rutaSimple(origen, destino) {
        const url = `${this.OSRM_URL}/route/v1/driving/` +
            `${origen.lng},${origen.lat};${destino.lng},${destino.lat}` +
            `?overview=full&geometries=geojson`;
        const res = await fetch(url);
        if (!res.ok)
            throw new common_1.BadRequestException('OSRM error');
        const data = await res.json();
        if (data.code !== 'Ok') {
            throw new common_1.BadRequestException(`Ruta no encontrada: ${data.code}`);
        }
        const route = data.routes[0];
        return {
            distancia_metros: route.distance,
            duracion_segundos: route.duration,
            geometria: route.geometry,
            distancia_texto: this.formatearDistancia(route.distance),
            duracion_texto: this.formatearDuracion(route.duration),
        };
    }
    formatearDistancia(metros) {
        if (metros < 1000)
            return `${Math.round(metros)} m`;
        return `${(metros / 1000).toFixed(1)} km`;
    }
    formatearDuracion(segundos) {
        const totalMin = Math.round(segundos / 60);
        if (totalMin < 60)
            return `${totalMin} min`;
        const horas = Math.floor(totalMin / 60);
        const min = totalMin % 60;
        return `${horas}h ${min}min`;
    }
};
exports.OsrmService = OsrmService;
exports.OsrmService = OsrmService = OsrmService_1 = __decorate([
    (0, common_1.Injectable)()
], OsrmService);
//# sourceMappingURL=osrm.service.js.map