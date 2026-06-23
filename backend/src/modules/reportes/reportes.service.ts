import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import PDFDocument from 'pdfkit';
 
export interface ReportePreventista {
  mes:    string;
  anio:   number;
  vendedor: { id: number; nombre: string };
  resumen: {
    total_ventas:        number;
    monto_facturado:     number;
    monto_entregado:     number;
    monto_cancelado:     number;
    promedio_por_venta:  number;
  };
  por_estado: Record<string, { cantidad: number; monto: number }>;
  ventas: Array<{
    id:       number;
    numero:   string;
    fecha:    string;
    cliente:  string;
    estado:   string;
    metodo_pago: string;
    total:    number;
  }>;
}
 
export interface ReporteRepartidor {
  mes:  string;
  anio: number;
  repartidor: { id: number; nombre: string };
  resumen: {
    total_entregas:       number;
    entregas_completas:   number;
    entregas_parciales:   number;
    devoluciones:         number;
    monto_entregado:      number;
  };
  por_dia: Array<{
    fecha:               string;
    entregas:            number;
    entregas_parciales:  number;
    monto:               number;
  }>;
}
 
@Injectable()
export class ReportesService {
  constructor(private prisma: PrismaService) {}
 
  // ── Helpers de rango de fechas ────────────────────────────
  private rangoMes(mes: number, anio: number): { inicio: Date; fin: Date } {
    return {
      inicio: new Date(anio, mes - 1, 1, 0, 0, 0),
      fin:    new Date(anio, mes,     0, 23, 59, 59),
    };
  }
 
  // ════════════════════════════════════════════════════════
  // REPORTE PREVENTISTA — Datos JSON
  // ════════════════════════════════════════════════════════
  async getReportePreventista(
    usuarioId: number, mes: number, anio: number,
  ): Promise<ReportePreventista> {
    const { inicio, fin } = this.rangoMes(mes, anio);
 
    const usuario = await this.prisma.usuario.findUnique({
      where:  { id: usuarioId },
      select: { id: true, nombres: true, apellido_paterno: true },
    });
 
    const pedidos = await this.prisma.pedido.findMany({
      where: {
        preventista_id: usuarioId,
        fecha_creacion: { gte: inicio, lte: fin },
      },
      include: { cliente: { select: { razon_social: true } } },
      orderBy: { fecha_creacion: 'asc' },
    });
 
    // Inicializar contadores por estado
    const estados = [
      'Borrador','Confirmado','Preparando','Listo_Carga','En_Ruta',
      'Entregado_Total','Entregado_Parcial','Cancelado','Devuelto',
    ];
    const porEstado: Record<string, { cantidad: number; monto: number }> = {};
    estados.forEach(e => porEstado[e] = { cantidad: 0, monto: 0 });
 
    let totalFacturado  = 0;
    let totalEntregado  = 0;
    let totalCancelado  = 0;
 
    for (const p of pedidos) {
      const monto = Number(p.total_monto);
      porEstado[p.estado].cantidad += 1;
      porEstado[p.estado].monto    += monto;
 
      if (!['Cancelado','Devuelto'].includes(p.estado)) totalFacturado += monto;
      if (['Entregado_Total','Entregado_Parcial'].includes(p.estado)) totalEntregado += monto;
      if (p.estado === 'Cancelado') totalCancelado += monto;
    }
 
    return {
      mes:  this.nombreMes(mes), anio,
      vendedor: {
        id:     usuario!.id,
        nombre: `${usuario!.nombres} ${usuario!.apellido_paterno ?? ''}`.trim(),
      },
      resumen: {
        total_ventas:       pedidos.length,
        monto_facturado:    totalFacturado,
        monto_entregado:    totalEntregado,
        monto_cancelado:    totalCancelado,
        promedio_por_venta: pedidos.length ? totalFacturado / pedidos.length : 0,
      },
      por_estado: porEstado,
      ventas: pedidos.map(p => ({
        id:          p.id,
        numero:      p.numero_pedido,
        fecha:       p.fecha_creacion.toISOString(),
        cliente:     p.cliente.razon_social,
        estado:      p.estado,
        metodo_pago: p.metodo_pago,
        total:       Number(p.total_monto),
      })),
    };
  }
 
  // ════════════════════════════════════════════════════════
  // REPORTE REPARTIDOR — Datos JSON
  // ════════════════════════════════════════════════════════
  async getReporteRepartidor(
    usuarioId: number, mes: number, anio: number,
  ): Promise<ReporteRepartidor> {
    const { inicio, fin } = this.rangoMes(mes, anio);
 
    const usuario = await this.prisma.usuario.findUnique({
      where:  { id: usuarioId },
      select: { id: true, nombres: true, apellido_paterno: true },
    });
 
    const pedidos = await this.prisma.pedido.findMany({
      where: {
        repartidor_id:      usuarioId,
        fecha_entrega_real: { gte: inicio, lte: fin },
      },
      orderBy: { fecha_entrega_real: 'asc' },
    });
 
    let completas  = 0;
    let parciales  = 0;
    let devolucion = 0;
    let montoTotal = 0;
 
    // Agrupar por día
    const porDia = new Map<string, { entregas: number; parciales: number; monto: number }>();
 
    for (const p of pedidos) {
      if (!p.fecha_entrega_real) continue;
      const fechaKey = p.fecha_entrega_real.toISOString().split('T')[0];   // YYYY-MM-DD
      const dia = porDia.get(fechaKey) ?? { entregas: 0, parciales: 0, monto: 0 };
 
      const monto = Number(p.total_monto);
      if (p.estado === 'Entregado_Total')    { completas++;  dia.entregas++;  montoTotal += monto; dia.monto += monto; }
      if (p.estado === 'Entregado_Parcial')  { parciales++;  dia.parciales++; montoTotal += monto; dia.monto += monto; }
      if (p.estado === 'Devuelto')             devolucion++;
 
      porDia.set(fechaKey, dia);
    }
 
    return {
      mes:  this.nombreMes(mes), anio,
      repartidor: {
        id:     usuario!.id,
        nombre: `${usuario!.nombres} ${usuario!.apellido_paterno ?? ''}`.trim(),
      },
      resumen: {
        total_entregas:     completas + parciales,
        entregas_completas: completas,
        entregas_parciales: parciales,
        devoluciones:       devolucion,
        monto_entregado:    montoTotal,
      },
      por_dia: Array.from(porDia.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([fecha, d]) => ({
          fecha,
          entregas:            d.entregas,
          entregas_parciales:  d.parciales,
          monto:               d.monto,
        })),
    };
  }
 
  // ════════════════════════════════════════════════════════
  // PDF — Reporte preventista
  // ════════════════════════════════════════════════════════
  async generarPDFPreventista(usuarioId: number, mes: number, anio: number): Promise<Buffer> {
    const data = await this.getReportePreventista(usuarioId, mes, anio);
    const doc = new PDFDocument({ size: 'A4', margins: { top: 50, bottom: 50, left: 50, right: 50 } });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    const finish = new Promise<Buffer>(r => doc.on('end', () => r(Buffer.concat(chunks))));
 
    this.dibujarHeader(doc, `Reporte de ventas — ${data.mes} ${data.anio}`, data.vendedor.nombre);
 
    let y = 170;
 
    // ── Stats ──
    this.dibujarCardStat(doc, 50,  y, 165, 'Total ventas',     String(data.resumen.total_ventas),                       '#2563EB');
    this.dibujarCardStat(doc, 220, y, 165, 'Facturado',        `Bs ${data.resumen.monto_facturado.toFixed(2)}`,          '#E11D48');
    this.dibujarCardStat(doc, 390, y, 155, 'Entregado',        `Bs ${data.resumen.monto_entregado.toFixed(2)}`,          '#059669');
    y += 70;
 
    this.dibujarCardStat(doc, 50,  y, 165, 'Cancelado',        `Bs ${data.resumen.monto_cancelado.toFixed(2)}`,          '#DC2626');
    this.dibujarCardStat(doc, 220, y, 165, 'Promedio venta',   `Bs ${data.resumen.promedio_por_venta.toFixed(2)}`,       '#7C3AED');
    y += 80;
 
    // ── Por estado ──
    doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(11).text('Detalle por estado', 50, y);
    y += 18;
 
    doc.rect(50, y, 495, 22).fill('#F8FAFC');
    doc.fillColor('#64748B').font('Helvetica-Bold').fontSize(9)
      .text('Estado',     60,  y + 7, { width: 200 })
      .text('Cantidad',   280, y + 7, { width: 80,  align: 'right' })
      .text('Monto',      400, y + 7, { width: 130, align: 'right' });
    y += 26;
 
    for (const [estado, val] of Object.entries(data.por_estado)) {
      if (val.cantidad === 0) continue;
      doc.fillColor('#0F172A').font('Helvetica').fontSize(9)
        .text(estado.replace(/_/g, ' '), 60, y, { width: 200 })
        .text(String(val.cantidad),       280, y, { width: 80,  align: 'right' })
        .text(`Bs ${val.monto.toFixed(2)}`, 400, y, { width: 130, align: 'right' });
      y += 16;
      doc.strokeColor('#F1F5F9').lineWidth(0.5).moveTo(50, y).lineTo(545, y).stroke();
      y += 4;
    }
 
    // ── Ventas individuales (nueva página si es necesario) ──
    if (y > 700) { doc.addPage(); y = 50; }
    y += 20;
 
    doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(11)
      .text('Ventas individuales', 50, y);
    y += 18;
 
    doc.rect(50, y, 495, 22).fill('#F8FAFC');
    doc.fillColor('#64748B').font('Helvetica-Bold').fontSize(8)
      .text('FECHA',   60,  y + 7, { width: 70 })
      .text('NÚMERO',  135, y + 7, { width: 60 })
      .text('CLIENTE', 200, y + 7, { width: 160 })
      .text('ESTADO',  365, y + 7, { width: 100 })
      .text('MONTO',   470, y + 7, { width: 70, align: 'right' });
    y += 26;
 
    for (const v of data.ventas) {
      if (y > 770) { doc.addPage(); y = 50; }
      doc.fillColor('#0F172A').font('Helvetica').fontSize(8)
        .text(this.fmtDate(v.fecha),  60,  y, { width: 70 })
        .text(v.numero,               135, y, { width: 60 })
        .text(v.cliente,              200, y, { width: 160 })
        .text(v.estado.replace(/_/g,' '), 365, y, { width: 100 })
        .text(`Bs ${v.total.toFixed(2)}`, 470, y, { width: 70, align: 'right' });
      y += 14;
      doc.strokeColor('#F1F5F9').lineWidth(0.5).moveTo(50, y).lineTo(545, y).stroke();
      y += 3;
    }
 
    doc.end();
    return finish;
  }
 
  // ════════════════════════════════════════════════════════
  // PDF — Reporte repartidor
  // ════════════════════════════════════════════════════════
  async generarPDFRepartidor(usuarioId: number, mes: number, anio: number): Promise<Buffer> {
    const data = await this.getReporteRepartidor(usuarioId, mes, anio);
    const doc = new PDFDocument({ size: 'A4', margins: { top: 50, bottom: 50, left: 50, right: 50 } });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    const finish = new Promise<Buffer>(r => doc.on('end', () => r(Buffer.concat(chunks))));
 
    this.dibujarHeader(doc, `Reporte de entregas — ${data.mes} ${data.anio}`, data.repartidor.nombre);
 
    let y = 170;
 
    this.dibujarCardStat(doc, 50,  y, 165, 'Total entregas',  String(data.resumen.total_entregas),        '#2563EB');
    this.dibujarCardStat(doc, 220, y, 165, 'Completas',       String(data.resumen.entregas_completas),    '#059669');
    this.dibujarCardStat(doc, 390, y, 155, 'Parciales',       String(data.resumen.entregas_parciales),    '#F59E0B');
    y += 70;
 
    this.dibujarCardStat(doc, 50,  y, 165, 'Devoluciones',    String(data.resumen.devoluciones),                          '#DC2626');
    this.dibujarCardStat(doc, 220, y, 325, 'Monto entregado', `Bs ${data.resumen.monto_entregado.toFixed(2)}`,            '#7C3AED');
    y += 80;
 
    // ── Detalle día por día ──
    doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(11)
      .text('Entregas día por día', 50, y);
    y += 18;
 
    doc.rect(50, y, 495, 22).fill('#F8FAFC');
    doc.fillColor('#64748B').font('Helvetica-Bold').fontSize(9)
      .text('FECHA',     60,  y + 7, { width: 120 })
      .text('COMPLETAS', 200, y + 7, { width: 80,  align: 'right' })
      .text('PARCIALES', 290, y + 7, { width: 80,  align: 'right' })
      .text('MONTO',     400, y + 7, { width: 130, align: 'right' });
    y += 26;
 
    if (data.por_dia.length === 0) {
      doc.fillColor('#94A3B8').font('Helvetica').fontSize(10)
        .text('Sin entregas registradas en este mes', 50, y, { width: 495, align: 'center' });
    }
 
    for (const d of data.por_dia) {
      if (y > 770) { doc.addPage(); y = 50; }
      doc.fillColor('#0F172A').font('Helvetica').fontSize(9)
        .text(this.fmtDateLong(d.fecha), 60,  y, { width: 130 })
        .text(String(d.entregas),         200, y, { width: 80, align: 'right' })
        .text(String(d.entregas_parciales),290, y, { width: 80, align: 'right' })
        .text(`Bs ${d.monto.toFixed(2)}`, 400, y, { width: 130, align: 'right' });
      y += 16;
      doc.strokeColor('#F1F5F9').lineWidth(0.5).moveTo(50, y).lineTo(545, y).stroke();
      y += 4;
    }
 
    doc.end();
    return finish;
  }
 
  // ════════════════════════════════════════════════════════
  // Helpers de dibujo
  // ════════════════════════════════════════════════════════
  private dibujarHeader(doc: PDFKit.PDFDocument, titulo: string, subtitulo: string) {
    doc.rect(50, 50, 4, 80).fill('#E11D48');
    doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(22).text('FENIXBD', 70, 55);
    doc.fillColor('#64748B').font('Helvetica').fontSize(9)
      .text('Sistema de Distribución Comercial', 70, 82)
      .text('Potosí, Bolivia', 70, 95);
 
    doc.fillColor('#E11D48').font('Helvetica-Bold').fontSize(15)
      .text(titulo, 250, 60, { width: 300, align: 'right' });
    doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(11)
      .text(subtitulo, 250, 85, { width: 300, align: 'right' });
    doc.fillColor('#94A3B8').font('Helvetica').fontSize(9)
      .text(`Generado: ${new Date().toLocaleDateString('es-BO')}`,
        250, 102, { width: 300, align: 'right' });
 
    doc.strokeColor('#E2E8F0').lineWidth(0.5)
      .moveTo(50, 145).lineTo(545, 145).stroke();
  }
 
  private dibujarCardStat(
    doc: PDFKit.PDFDocument,
    x: number, y: number, w: number,
    label: string, valor: string, color: string,
  ) {
    doc.roundedRect(x, y, w, 60, 6).strokeColor('#E2E8F0').lineWidth(0.5).stroke();
    doc.rect(x, y, 3, 60).fill(color);
    doc.fillColor('#64748B').font('Helvetica').fontSize(9)
      .text(label, x + 12, y + 12);
    doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(16)
      .text(valor, x + 12, y + 28, { width: w - 20 });
  }
 
  private fmtDate(iso: string): string {
    return new Date(iso).toLocaleDateString('es-BO');
  }
 
  private fmtDateLong(yyyymmdd: string): string {
    const [a, m, d] = yyyymmdd.split('-').map(Number);
    const date = new Date(a, m - 1, d);
    return date.toLocaleDateString('es-BO', { weekday: 'short', day: '2-digit', month: 'short' });
  }
 
  private nombreMes(m: number): string {
    return ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
            'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'][m - 1];
  }
}
