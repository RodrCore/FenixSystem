export interface LatLng {
    lat: number;
    lng: number;
}
export interface RutaOptimizada {
    orden: number[];
    distancia_metros: number;
    duracion_segundos: number;
    geometria: {
        type: 'LineString';
        coordinates: [number, number][];
    };
    distancia_texto: string;
    duracion_texto: string;
}
export declare class OsrmService {
    private readonly logger;
    private readonly OSRM_URL;
    optimizarRuta(origen: LatLng, paradas: LatLng[]): Promise<RutaOptimizada>;
    rutaSimple(origen: LatLng, destino: LatLng): Promise<{
        distancia_metros: number;
        duracion_segundos: number;
        geometria: {
            type: 'LineString';
            coordinates: [number, number][];
        };
        distancia_texto: string;
        duracion_texto: string;
    }>;
    private formatearDistancia;
    private formatearDuracion;
}
