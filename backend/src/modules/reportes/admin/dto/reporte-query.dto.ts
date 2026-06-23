// ═══════════════════════════════════════════════════════════════
// backend/src/modules/reportes/admin/dto/reporte-query.dto.ts
// ═══════════════════════════════════════════════════════════════

export interface ReporteQuery {
  desde?: string;    // ISO date "2026-06-01"
  hasta?: string;    // ISO date "2026-06-30"
  periodo?: 'hoy' | 'semana' | 'mes' | 'anio' | 'custom';
}

export interface ExportQuery extends ReporteQuery {
  formato: 'excel' | 'pdf';
}

/**
 * Calcula rango de fechas según el período preestablecido.
 * Si periodo=custom o no se especifica, usa desde/hasta del query.
 */
export function calcularRango(query: ReporteQuery): {
  desde: Date;
  hasta: Date;
  desdePeriodoAnterior: Date;
  hastaPeriodoAnterior: Date;
} {
  const ahora = new Date();
  let desde: Date;
  let hasta: Date = new Date(ahora);

  switch (query.periodo) {
    case 'hoy': {
      desde = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 0, 0, 0);
      hasta = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59, 59);
      break;
    }
    case 'semana': {
      // Inicio de semana (lunes)
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
      } else {
        // Default: este mes
        desde = new Date(ahora.getFullYear(), ahora.getMonth(), 1, 0, 0, 0);
      }
      if (query.hasta) {
        hasta = new Date(query.hasta + 'T23:59:59');
      }
    }
  }

  // Período anterior de la MISMA duración
  const ms = hasta.getTime() - desde.getTime();
  const hastaPeriodoAnterior = new Date(desde.getTime() - 1);
  const desdePeriodoAnterior = new Date(desde.getTime() - ms - 1);

  return { desde, hasta, desdePeriodoAnterior, hastaPeriodoAnterior };
}

/**
 * Calcula el % de variación entre dos valores
 */
export function calcularVariacion(actual: number, anterior: number): number {
  if (anterior === 0) return actual > 0 ? 100 : 0;
  return Number((((actual - anterior) / anterior) * 100).toFixed(1));
}

/**
 * Formatea una fecha a "YYYY-MM-DD"
 */
export function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}