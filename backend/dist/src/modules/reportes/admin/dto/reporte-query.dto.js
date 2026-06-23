"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calcularRango = calcularRango;
exports.calcularVariacion = calcularVariacion;
exports.formatDate = formatDate;
function calcularRango(query) {
    const ahora = new Date();
    let desde;
    let hasta = new Date(ahora);
    switch (query.periodo) {
        case 'hoy': {
            desde = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 0, 0, 0);
            hasta = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59, 59);
            break;
        }
        case 'semana': {
            const day = ahora.getDay();
            const diff = ahora.getDate() - day + (day === 0 ? -6 : 1);
            desde = new Date(ahora.getFullYear(), ahora.getMonth(), diff, 0, 0, 0);
            hasta = new Date(ahora);
            break;
        }
        case 'mes': {
            desde = new Date(ahora.getFullYear(), ahora.getMonth(), 1, 0, 0, 0);
            hasta = new Date(ahora);
            break;
        }
        case 'anio': {
            desde = new Date(ahora.getFullYear(), 0, 1, 0, 0, 0);
            hasta = new Date(ahora);
            break;
        }
        case 'custom':
        default: {
            if (query.desde) {
                desde = new Date(query.desde + 'T00:00:00');
            }
            else {
                desde = new Date(ahora.getFullYear(), ahora.getMonth(), 1, 0, 0, 0);
            }
            if (query.hasta) {
                hasta = new Date(query.hasta + 'T23:59:59');
            }
        }
    }
    const ms = hasta.getTime() - desde.getTime();
    const hastaPeriodoAnterior = new Date(desde.getTime() - 1);
    const desdePeriodoAnterior = new Date(desde.getTime() - ms - 1);
    return { desde, hasta, desdePeriodoAnterior, hastaPeriodoAnterior };
}
function calcularVariacion(actual, anterior) {
    if (anterior === 0)
        return actual > 0 ? 100 : 0;
    return Number((((actual - anterior) / anterior) * 100).toFixed(1));
}
function formatDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}
//# sourceMappingURL=reporte-query.dto.js.map