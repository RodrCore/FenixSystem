import { OsrmService, LatLng } from './osrm.service';
export declare class RoutingController {
    private osrm;
    constructor(osrm: OsrmService);
    optimizar(dto: {
        origen: LatLng;
        paradas: LatLng[];
    }): Promise<import("./osrm.service").RutaOptimizada>;
    ruta(dto: {
        origen: LatLng;
        destino: LatLng;
    }): Promise<{
        distancia_metros: number;
        duracion_segundos: number;
        geometria: {
            type: "LineString";
            coordinates: [number, number][];
        };
        distancia_texto: string;
        duracion_texto: string;
    }>;
}
