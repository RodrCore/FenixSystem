import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ExcelExporterService {
  /**
   * Genera un Buffer Excel con los datos del reporte indicado.
   */
  async exportar(seccion: string, data: any): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'FenixBd';
    workbook.created = new Date();

    switch (seccion) {
      case 'ventas':
        this.hojaVentas(workbook, data);
        break;
      case 'pedidos':
        this.hojaPedidos(workbook, data);
        break;
      case 'reabastecimientos':
        this.hojaReabastecimientos(workbook, data);
        break;
      case 'inventario':
        this.hojaInventario(workbook, data);
        break;
      case 'comercial':
        this.hojaComercial(workbook, data);
        break;
      case 'clientes':
        this.hojaClientes(workbook, data);
        break;
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  // ─── Helpers de formato ──────────────────────────
  private setHeaderRow(sheet: ExcelJS.Worksheet, headers: string[]) {
    const row = sheet.addRow(headers);
    row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    row.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE11D48' },
    };
    row.alignment = { vertical: 'middle', horizontal: 'center' };
    row.height = 22;
    headers.forEach((_, i) => {
      const col = sheet.getColumn(i + 1);
      if (!col.width || col.width < 18) col.width = 18;
    });
  }

  private setKPIsHeader(sheet: ExcelJS.Worksheet, titulo: string, periodo?: any) {
    sheet.addRow([titulo]).font = { size: 16, bold: true };
    if (periodo?.desde && periodo?.hasta) {
      const d = new Date(periodo.desde).toLocaleDateString('es-BO');
      const h = new Date(periodo.hasta).toLocaleDateString('es-BO');
      sheet.addRow([`Período: ${d} al ${h}`]).font = { italic: true, color: { argb: 'FF64748B' } };
    }
    sheet.addRow([]);
  }

  // ─── Ventas ─────────────────────────────────────
  private hojaVentas(wb: ExcelJS.Workbook, data: any) {
    const s = wb.addWorksheet('Ventas');
    this.setKPIsHeader(s, 'Reporte de Ventas', data.periodo);

    // KPIs
    s.addRow(['KPIs']).font = { bold: true, size: 13 };
    s.addRow(['Total ventas', `Bs ${data.kpis.total_ventas.toFixed(2)}`]);
    s.addRow(['Cantidad de pedidos', data.kpis.cantidad_pedidos]);
    s.addRow(['Ticket promedio', `Bs ${data.kpis.ticket_promedio.toFixed(2)}`]);
    s.addRow(['Variación vs período anterior', `${data.kpis.variacion_total}%`]);
    s.addRow([]);

    // Top productos
    s.addRow(['Top 10 productos']).font = { bold: true, size: 13 };
    this.setHeaderRow(s, ['#', 'Producto', 'Código', 'Unidades', 'Total Bs']);
    data.top_productos.forEach((p: any, i: number) => {
      s.addRow([i + 1, p.nombre, p.codigo, p.unidades_vendidas, p.total_vendido]);
    });
    s.addRow([]);

    // Top clientes
    s.addRow(['Top 10 clientes']).font = { bold: true, size: 13 };
    this.setHeaderRow(s, ['#', 'Cliente', 'Compras', 'Total Bs']);
    data.top_clientes.forEach((c: any, i: number) => {
      s.addRow([i + 1, c.nombre, c.compras, c.total]);
    });
    s.addRow([]);

    // Evolución diaria
    s.addRow(['Evolución por día']).font = { bold: true, size: 13 };
    this.setHeaderRow(s, ['Fecha', 'Cantidad', 'Total Bs']);
    data.evolucion.forEach((e: any) => s.addRow([e.fecha, e.cantidad, e.total]));
  }

  // ─── Pedidos ────────────────────────────────────
  private hojaPedidos(wb: ExcelJS.Workbook, data: any) {
    const s = wb.addWorksheet('Pedidos');
    this.setKPIsHeader(s, 'Reporte de Pedidos', data.periodo);

    s.addRow(['Total pedidos', data.kpis.total_pedidos]);
    s.addRow(['Variación %', `${data.kpis.variacion}%`]);
    s.addRow(['Promedio días entrega', data.kpis.promedio_dias_entrega]);
    s.addRow([]);

    s.addRow(['Por estado']).font = { bold: true, size: 13 };
    this.setHeaderRow(s, ['Estado', 'Cantidad', 'Total Bs']);
    data.por_estado.forEach((e: any) => s.addRow([e.estado, e.cantidad, e.total]));
    s.addRow([]);

    s.addRow(['Top preventistas']).font = { bold: true, size: 13 };
    this.setHeaderRow(s, ['#', 'Nombre', 'Pedidos', 'Total vendido Bs']);
    data.top_preventistas.forEach((p: any, i: number) => {
      s.addRow([i + 1, p.nombre, p.cantidad_pedidos, p.total_vendido]);
    });
  }

  // ─── Reabastecimientos ──────────────────────────
  private hojaReabastecimientos(wb: ExcelJS.Workbook, data: any) {
    const s = wb.addWorksheet('Reabastecimientos');
    this.setKPIsHeader(s, 'Reporte de Reabastecimientos', data.periodo);

    s.addRow(['Total comprado', `Bs ${data.kpis.total_comprado.toFixed(2)}`]);
    s.addRow(['Cantidad de órdenes', data.kpis.cantidad_ordenes]);
    s.addRow(['Variación %', `${data.kpis.variacion}%`]);
    s.addRow([]);

    s.addRow(['Por proveedor']).font = { bold: true, size: 13 };
    this.setHeaderRow(s, ['#', 'Proveedor', 'Órdenes', 'Total Bs']);
    data.por_proveedor.forEach((p: any, i: number) => {
      s.addRow([i + 1, p.nombre, p.cantidad_ordenes, p.total_comprado]);
    });
    s.addRow([]);

    s.addRow(['Productos más comprados']).font = { bold: true, size: 13 };
    this.setHeaderRow(s, ['#', 'Producto', 'Presentación', 'Cantidad', 'Total Bs']);
    data.productos_mas_comprados.forEach((p: any, i: number) => {
      s.addRow([i + 1, p.producto, p.presentacion, p.cantidad, p.total]);
    });
  }

  // ─── Inventario ─────────────────────────────────
  private hojaInventario(wb: ExcelJS.Workbook, data: any) {
    const s = wb.addWorksheet('Inventario');
    this.setKPIsHeader(s, 'Reporte de Inventario');

    s.addRow(['Total productos', data.kpis.total_productos]);
    s.addRow(['Stock bajo', data.kpis.productos_stock_bajo]);
    s.addRow(['Sin stock', data.kpis.productos_sin_stock]);
    s.addRow(['Lotes por vencer (30d)', data.kpis.lotes_por_vencer]);
    s.addRow(['Lotes vencidos', data.kpis.lotes_vencidos]);
    s.addRow(['Valor inventario', `Bs ${data.kpis.valor_inventario.toFixed(2)}`]);
    s.addRow([]);

    s.addRow(['Productos con stock bajo']).font = { bold: true, size: 13 };
    this.setHeaderRow(s, ['#', 'Producto', 'Código', 'Stock actual', 'Stock mínimo', 'Déficit']);
    data.productos_stock_bajo.forEach((p: any, i: number) => {
      s.addRow([i + 1, p.nombre, p.codigo, p.stock_actual, p.stock_minimo, p.deficit]);
    });
    s.addRow([]);

    s.addRow(['Lotes por vencer (próximos 30 días)']).font = { bold: true, size: 13 };
    this.setHeaderRow(s, ['#', 'Código lote', 'Producto', 'Cantidad', 'Vence', 'Días restantes']);
    data.lotes_por_vencer.forEach((l: any, i: number) => {
      const f = new Date(l.fecha_vencimiento).toLocaleDateString('es-BO');
      s.addRow([i + 1, l.codigo_lote, l.producto, l.cantidad, f, l.dias_restantes]);
    });
  }

  // ─── Comercial ──────────────────────────────────
  private hojaComercial(wb: ExcelJS.Workbook, data: any) {
    const s = wb.addWorksheet('Comercial');
    this.setKPIsHeader(s, 'Reporte Comercial por Usuario', data.periodo);

    s.addRow(['Preventistas activos', data.kpis.total_preventistas_activos]);
    s.addRow(['Repartidores activos', data.kpis.total_repartidores_activos]);
    s.addRow([]);

    s.addRow(['Preventistas']).font = { bold: true, size: 13 };
    this.setHeaderRow(s, ['#', 'Nombre', 'Pedidos', 'Total vendido Bs', 'Ticket promedio Bs']);
    data.preventistas.forEach((p: any, i: number) => {
      s.addRow([i + 1, p.nombre, p.cantidad_pedidos, p.total_vendido, p.ticket_promedio]);
    });
    s.addRow([]);

    s.addRow(['Repartidores']).font = { bold: true, size: 13 };
    this.setHeaderRow(s, ['#', 'Nombre', 'Entregas', 'Monto entregado Bs']);
    data.repartidores.forEach((p: any, i: number) => {
      s.addRow([i + 1, p.nombre, p.entregas, p.monto_entregado]);
    });
  }

  // ─── Clientes ───────────────────────────────────
  private hojaClientes(wb: ExcelJS.Workbook, data: any) {
    const s = wb.addWorksheet('Clientes');
    this.setKPIsHeader(s, 'Reporte de Clientes', data.periodo);

    s.addRow(['Total clientes', data.kpis.total_clientes]);
    s.addRow(['Nuevos en período', data.kpis.nuevos_en_periodo]);
    s.addRow(['Activos (compraron últimos 60d)', data.kpis.clientes_activos]);
    s.addRow(['Inactivos (sin compras 60d)', data.kpis.clientes_inactivos]);
    s.addRow([]);

    s.addRow(['Top clientes por compras']).font = { bold: true, size: 13 };
    this.setHeaderRow(s, ['#', 'Cliente', 'Zona', 'Compras', 'Total Bs']);
    data.top_clientes.forEach((c: any, i: number) => {
      s.addRow([i + 1, c.nombre, c.zona, c.compras, c.total]);
    });
    s.addRow([]);

    s.addRow(['Distribución por zona']).font = { bold: true, size: 13 };
    this.setHeaderRow(s, ['Zona', 'Cantidad de clientes']);
    data.por_zona.forEach((z: any) => s.addRow([z.zona, z.cantidad]));
  }
}