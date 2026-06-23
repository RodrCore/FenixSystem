export interface ReporteQuery {
    desde?: string;
    hasta?: string;
    periodo?: 'hoy' | 'semana' | 'mes' | 'anio' | 'custom';
}
export interface ExportQuery extends ReporteQuery {
    formato: 'excel' | 'pdf';
}
export declare function calcularRango(query: ReporteQuery): {
    desde: Date;
    hasta: Date;
    desdePeriodoAnterior: Date;
    hastaPeriodoAnterior: Date;
};
export declare function calcularVariacion(actual: number, anterior: number): number;
export declare function formatDate(d: Date): string;
