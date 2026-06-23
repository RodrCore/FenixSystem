"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdfExporterService = void 0;
const common_1 = require("@nestjs/common");
const pdfkit_1 = __importDefault(require("pdfkit"));
let PdfExporterService = class PdfExporterService {
    async exportar(seccion, data) {
        return new Promise((resolve, reject) => {
            const doc = new pdfkit_1.default({ size: 'A4', margin: 40 });
            const buffers = [];
            doc.on('data', b => buffers.push(b));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);
            this.encabezado(doc, this.tituloPorSeccion(seccion), data.periodo);
            switch (seccion) {
                case 'ventas':
                    this.pdfVentas(doc, data);
                    break;
                case 'pedidos':
                    this.pdfPedidos(doc, data);
                    break;
                case 'reabastecimientos':
                    this.pdfReabastecimientos(doc, data);
                    break;
                case 'inventario':
                    this.pdfInventario(doc, data);
                    break;
                case 'comercial':
                    this.pdfComercial(doc, data);
                    break;
                case 'clientes':
                    this.pdfClientes(doc, data);
                    break;
            }
            doc.end();
        });
    }
    tituloPorSeccion(seccion) {
        const m = {
            ventas: 'Reporte de Ventas',
            pedidos: 'Reporte de Pedidos',
            reabastecimientos: 'Reporte de Reabastecimientos',
            inventario: 'Reporte de Inventario',
            comercial: 'Reporte Comercial por Usuario',
            clientes: 'Reporte de Clientes',
        };
        return m[seccion] || 'Reporte';
    }
    encabezado(doc, titulo, periodo) {
        doc.fillColor('#E11D48').fontSize(20).font('Helvetica-Bold').text('FenixBd', 40, 40);
        doc.fillColor('#0F172A').fontSize(16).text(titulo, 40, 65);
        if (periodo?.desde && periodo?.hasta) {
            const d = new Date(periodo.desde).toLocaleDateString('es-BO');
            const h = new Date(periodo.hasta).toLocaleDateString('es-BO');
            doc.fontSize(10).fillColor('#64748B').font('Helvetica').text(`Período: ${d} al ${h}`, 40, 88);
        }
        const fechaGen = new Date().toLocaleDateString('es-BO');
        doc.text(`Generado: ${fechaGen}`, 40, 102);
        doc.moveTo(40, 120).lineTo(555, 120).strokeColor('#E2E8F0').stroke();
        doc.y = 135;
    }
    kpiBox(doc, label, value, x, y, w = 165) {
        doc.roundedRect(x, y, w, 50, 6).fillColor('#F8FAFC').fill();
        doc.fillColor('#64748B').fontSize(8).font('Helvetica').text(label.toUpperCase(), x + 10, y + 8);
        doc.fillColor('#0F172A').fontSize(14).font('Helvetica-Bold').text(value, x + 10, y + 22);
    }
    seccionTitulo(doc, texto) {
        if (doc.y > 720)
            doc.addPage();
        doc.moveDown(0.7);
        doc.fillColor('#0F172A').fontSize(12).font('Helvetica-Bold').text(texto);
        doc.moveDown(0.3);
    }
    tabla(doc, columnas, filas, widths) {
        const startX = 40;
        const tableWidth = 515;
        const colWidths = widths || columnas.map(() => tableWidth / columnas.length);
        if (doc.y > 700)
            doc.addPage();
        let x = startX;
        doc.fillColor('#E11D48').rect(startX, doc.y, tableWidth, 20).fill();
        doc.fillColor('#FFFFFF').fontSize(9).font('Helvetica-Bold');
        columnas.forEach((c, i) => {
            doc.text(c, x + 5, doc.y + 6, { width: colWidths[i] - 10 });
            x += colWidths[i];
        });
        doc.y += 22;
        doc.fillColor('#0F172A').font('Helvetica').fontSize(8.5);
        filas.forEach((fila, idx) => {
            if (doc.y > 770) {
                doc.addPage();
                let x2 = startX;
                doc.fillColor('#E11D48').rect(startX, doc.y, tableWidth, 20).fill();
                doc.fillColor('#FFFFFF').fontSize(9).font('Helvetica-Bold');
                columnas.forEach((c, i) => {
                    doc.text(c, x2 + 5, doc.y + 6, { width: colWidths[i] - 10 });
                    x2 += colWidths[i];
                });
                doc.y += 22;
                doc.fillColor('#0F172A').font('Helvetica').fontSize(8.5);
            }
            if (idx % 2 === 1) {
                doc.fillColor('#F8FAFC').rect(startX, doc.y, tableWidth, 18).fill();
                doc.fillColor('#0F172A');
            }
            let x2 = startX;
            const startY = doc.y;
            fila.forEach((val, i) => {
                doc.text(String(val ?? ''), x2 + 5, startY + 5, {
                    width: colWidths[i] - 10,
                    ellipsis: true,
                });
                x2 += colWidths[i];
            });
            doc.y = startY + 18;
        });
        doc.moveDown(0.5);
    }
    pdfVentas(doc, data) {
        const y = doc.y;
        this.kpiBox(doc, 'Total ventas', `Bs ${data.kpis.total_ventas.toFixed(2)}`, 40, y);
        this.kpiBox(doc, 'Pedidos', String(data.kpis.cantidad_pedidos), 215, y);
        this.kpiBox(doc, 'Ticket prom.', `Bs ${data.kpis.ticket_promedio.toFixed(2)}`, 390, y);
        doc.y = y + 65;
        this.kpiBox(doc, 'Variación', `${data.kpis.variacion_total}%`, 40, doc.y);
        this.kpiBox(doc, 'Anterior', `Bs ${data.kpis.total_anterior.toFixed(2)}`, 215, doc.y);
        doc.y += 65;
        this.seccionTitulo(doc, 'Top 10 productos');
        this.tabla(doc, ['#', 'Producto', 'Código', 'Unidades', 'Total Bs'], data.top_productos.map((p, i) => [
            i + 1, p.nombre, p.codigo, p.unidades_vendidas, p.total_vendido.toFixed(2),
        ]), [30, 220, 90, 70, 105]);
        this.seccionTitulo(doc, 'Top 10 clientes');
        this.tabla(doc, ['#', 'Cliente', 'Compras', 'Total Bs'], data.top_clientes.map((c, i) => [
            i + 1, c.nombre, c.compras, c.total.toFixed(2),
        ]), [30, 305, 80, 100]);
    }
    pdfPedidos(doc, data) {
        const y = doc.y;
        this.kpiBox(doc, 'Total pedidos', String(data.kpis.total_pedidos), 40, y);
        this.kpiBox(doc, 'Variación', `${data.kpis.variacion}%`, 215, y);
        this.kpiBox(doc, 'Prom. entrega', `${data.kpis.promedio_dias_entrega} días`, 390, y);
        doc.y = y + 65;
        this.seccionTitulo(doc, 'Por estado');
        this.tabla(doc, ['Estado', 'Cantidad', 'Total Bs'], data.por_estado.map((e) => [e.estado, e.cantidad, e.total.toFixed(2)]), [225, 130, 160]);
        this.seccionTitulo(doc, 'Top preventistas');
        this.tabla(doc, ['#', 'Nombre', 'Pedidos', 'Total Bs'], data.top_preventistas.map((p, i) => [
            i + 1, p.nombre, p.cantidad_pedidos, p.total_vendido.toFixed(2),
        ]), [30, 285, 80, 120]);
    }
    pdfReabastecimientos(doc, data) {
        const y = doc.y;
        this.kpiBox(doc, 'Total comprado', `Bs ${data.kpis.total_comprado.toFixed(2)}`, 40, y);
        this.kpiBox(doc, 'Órdenes', String(data.kpis.cantidad_ordenes), 215, y);
        this.kpiBox(doc, 'Variación', `${data.kpis.variacion}%`, 390, y);
        doc.y = y + 65;
        this.seccionTitulo(doc, 'Por proveedor');
        this.tabla(doc, ['#', 'Proveedor', 'Órdenes', 'Total Bs'], data.por_proveedor.map((p, i) => [
            i + 1, p.nombre, p.cantidad_ordenes, p.total_comprado.toFixed(2),
        ]), [30, 285, 80, 120]);
        this.seccionTitulo(doc, 'Productos más comprados');
        this.tabla(doc, ['#', 'Producto', 'Pres.', 'Cant.', 'Total Bs'], data.productos_mas_comprados.map((p, i) => [
            i + 1, p.producto, p.presentacion, p.cantidad, p.total.toFixed(2),
        ]), [30, 230, 90, 60, 105]);
    }
    pdfInventario(doc, data) {
        const y = doc.y;
        this.kpiBox(doc, 'Total productos', String(data.kpis.total_productos), 40, y);
        this.kpiBox(doc, 'Stock bajo', String(data.kpis.productos_stock_bajo), 215, y);
        this.kpiBox(doc, 'Sin stock', String(data.kpis.productos_sin_stock), 390, y);
        doc.y = y + 65;
        this.kpiBox(doc, 'Por vencer (30d)', String(data.kpis.lotes_por_vencer), 40, doc.y);
        this.kpiBox(doc, 'Vencidos', String(data.kpis.lotes_vencidos), 215, doc.y);
        this.kpiBox(doc, 'Valor inv.', `Bs ${data.kpis.valor_inventario.toFixed(2)}`, 390, doc.y);
        doc.y += 65;
        this.seccionTitulo(doc, 'Productos con stock bajo');
        this.tabla(doc, ['#', 'Producto', 'Código', 'Stock', 'Mínimo', 'Déficit'], data.productos_stock_bajo.map((p, i) => [
            i + 1, p.nombre, p.codigo, p.stock_actual, p.stock_minimo, p.deficit,
        ]), [30, 225, 90, 60, 60, 50]);
        this.seccionTitulo(doc, 'Lotes por vencer (próximos 30 días)');
        this.tabla(doc, ['#', 'Lote', 'Producto', 'Cant.', 'Vence', 'Días'], data.lotes_por_vencer.map((l, i) => {
            const f = new Date(l.fecha_vencimiento).toLocaleDateString('es-BO');
            return [i + 1, l.codigo_lote, l.producto, l.cantidad, f, l.dias_restantes];
        }), [25, 90, 200, 55, 80, 65]);
    }
    pdfComercial(doc, data) {
        const y = doc.y;
        this.kpiBox(doc, 'Preventistas', String(data.kpis.total_preventistas_activos), 40, y);
        this.kpiBox(doc, 'Repartidores', String(data.kpis.total_repartidores_activos), 215, y);
        doc.y = y + 65;
        this.seccionTitulo(doc, 'Preventistas');
        this.tabla(doc, ['#', 'Nombre', 'Pedidos', 'Total Bs', 'Ticket prom. Bs'], data.preventistas.map((p, i) => [
            i + 1, p.nombre, p.cantidad_pedidos, p.total_vendido.toFixed(2), p.ticket_promedio.toFixed(2),
        ]), [25, 235, 60, 95, 100]);
        this.seccionTitulo(doc, 'Repartidores');
        this.tabla(doc, ['#', 'Nombre', 'Entregas', 'Monto entregado Bs'], data.repartidores.map((p, i) => [
            i + 1, p.nombre, p.entregas, p.monto_entregado.toFixed(2),
        ]), [25, 285, 80, 125]);
    }
    pdfClientes(doc, data) {
        const y = doc.y;
        this.kpiBox(doc, 'Total clientes', String(data.kpis.total_clientes), 40, y);
        this.kpiBox(doc, 'Nuevos', String(data.kpis.nuevos_en_periodo), 215, y);
        this.kpiBox(doc, 'Inactivos', String(data.kpis.clientes_inactivos), 390, y);
        doc.y = y + 65;
        this.seccionTitulo(doc, 'Top clientes');
        this.tabla(doc, ['#', 'Cliente', 'Zona', 'Compras', 'Total Bs'], data.top_clientes.map((c, i) => [
            i + 1, c.nombre, c.zona, c.compras, c.total.toFixed(2),
        ]), [25, 235, 90, 65, 100]);
        this.seccionTitulo(doc, 'Por zona');
        this.tabla(doc, ['Zona', 'Clientes'], data.por_zona.map((z) => [z.zona, z.cantidad]), [320, 195]);
    }
};
exports.PdfExporterService = PdfExporterService;
exports.PdfExporterService = PdfExporterService = __decorate([
    (0, common_1.Injectable)()
], PdfExporterService);
//# sourceMappingURL=pdf-exporter.service.js.map