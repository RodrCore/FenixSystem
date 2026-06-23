
import { Injectable } from '@nestjs/common';
import PDFKit from 'pdfkit';
 
@Injectable()
export class ReabastecimientoPdfService {
  async generar(orden: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFKit({ size: 'A4', margin: 40 });
      const chunks: Buffer[] = [];
 
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
 
      // ═════════════ ENCABEZADO ═════════════
      doc
        .fillColor('#E11D48')
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('FENIXBD', 40, 40);
 
      doc
        .fillColor('#64748B')
        .fontSize(9)
        .font('Helvetica')
        .text('Sistema de Distribución', 40, 65);
 
      doc
        .fillColor('#0F172A')
        .fontSize(16)
        .font('Helvetica-Bold')
        .text('ORDEN DE REABASTECIMIENTO', 0, 40, { align: 'right' });
 
      doc
        .fillColor('#E11D48')
        .fontSize(13)
        .font('Helvetica-Bold')
        .text(orden.numero_orden, 0, 62, { align: 'right' });
 
      // Línea divisoria
      doc
        .strokeColor('#E2E8F0')
        .lineWidth(0.5)
        .moveTo(40, 100)
        .lineTo(555, 100)
        .stroke();
 
      // ═════════════ INFO PRINCIPAL ═════════════
      let y = 115;
 
      doc.fillColor('#64748B').fontSize(8).font('Helvetica-Bold')
        .text('PROVEEDOR', 40, y);
 
      doc.fillColor('#0F172A').fontSize(11).font('Helvetica-Bold')
        .text(orden.proveedor?.razon_social || '—', 40, y + 12);
 
      if (orden.proveedor?.nombre_comercial) {
        doc.fillColor('#64748B').fontSize(9).font('Helvetica')
          .text(orden.proveedor.nombre_comercial, 40, y + 28);
      }
      if (orden.proveedor?.nit_rfc) {
        doc.fillColor('#64748B').fontSize(9).font('Helvetica')
          .text(`NIT/RFC: ${orden.proveedor.nit_rfc}`, 40, y + 42);
      }
      if (orden.proveedor?.contacto_telefono) {
        doc.fillColor('#64748B').fontSize(9)
          .text(`Tel: ${orden.proveedor.contacto_telefono}`, 40, y + 56);
      }
 
      // Lado derecho — fechas y estado
      doc.fillColor('#64748B').fontSize(8).font('Helvetica-Bold')
        .text('FECHA DE SOLICITUD', 350, y);
      doc.fillColor('#0F172A').fontSize(10).font('Helvetica')
        .text(this.formatFecha(orden.fecha_solicitud), 350, y + 12);
 
      if (orden.fecha_esperada) {
        doc.fillColor('#64748B').fontSize(8).font('Helvetica-Bold')
          .text('FECHA ESPERADA', 350, y + 30);
        doc.fillColor('#0F172A').fontSize(10).font('Helvetica')
          .text(this.formatFecha(orden.fecha_esperada), 350, y + 42);
      }
 
      if (orden.fecha_recepcion) {
        doc.fillColor('#64748B').fontSize(8).font('Helvetica-Bold')
          .text('FECHA RECEPCIÓN', 350, y + 60);
        doc.fillColor('#059669').fontSize(10).font('Helvetica-Bold')
          .text(this.formatFecha(orden.fecha_recepcion), 350, y + 72);
      }
 
      // Estado badge
      const estadoColor = this.colorEstado(orden.estado);
      doc
        .roundedRect(440, y - 5, 115, 20, 4)
        .fill(estadoColor.bg);
      doc
        .fillColor(estadoColor.fg)
        .fontSize(9)
        .font('Helvetica-Bold')
        .text(this.formatEstado(orden.estado), 440, y, {
          width: 115, align: 'center',
        });
 
      y = 200;
 
      // ═════════════ TABLA DE PRODUCTOS ═════════════
      // Header
      doc
        .rect(40, y, 515, 22)
        .fill('#F8FAFC');
 
      doc
        .fillColor('#475569')
        .fontSize(8.5)
        .font('Helvetica-Bold');
      doc.text('PRODUCTO', 48, y + 7);
      doc.text('PRESENT.', 280, y + 7);
      doc.text('SOL.', 345, y + 7, { width: 40, align: 'right' });
      doc.text('REC.', 395, y + 7, { width: 40, align: 'right' });
      doc.text('P. UNIT.', 445, y + 7, { width: 50, align: 'right' });
      doc.text('SUBTOTAL', 500, y + 7, { width: 50, align: 'right' });
 
      y += 25;
 
      // Rows
      doc.fillColor('#0F172A').fontSize(9).font('Helvetica');
      for (const d of orden.detalles) {
        const pp = d.producto_presentacion;
        if (y > 730) {
          doc.addPage();
          y = 50;
        }
 
        // Producto
        doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(9)
          .text(pp.producto.nombre, 48, y, { width: 220 });
        if (pp.producto.codigo_interno) {
          doc.fillColor('#94A3B8').font('Helvetica').fontSize(7)
            .text(pp.producto.codigo_interno, 48, y + 12);
        }
 
        // Presentación
        doc.fillColor('#475569').font('Helvetica').fontSize(8.5)
          .text(pp.presentacion.nombre, 280, y + 4, { width: 60 });
 
        // Cantidad solicitada
        doc.fillColor('#0F172A').font('Helvetica').fontSize(9)
          .text(String(d.cantidad_solicitada), 345, y + 4, { width: 40, align: 'right' });
 
        // Cantidad recibida
        const recColor = d.cantidad_recibida === d.cantidad_solicitada
          ? '#059669' : d.cantidad_recibida === 0 ? '#94A3B8' : '#D97706';
        doc.fillColor(recColor).font('Helvetica-Bold').fontSize(9)
          .text(String(d.cantidad_recibida), 395, y + 4, { width: 40, align: 'right' });
 
        // Precio unitario
        doc.fillColor('#0F172A').font('Helvetica').fontSize(9)
          .text(`Bs ${Number(d.precio_unitario_compra).toFixed(2)}`, 445, y + 4, {
            width: 50, align: 'right',
          });
 
        // Subtotal
        doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(9)
          .text(`Bs ${Number(d.subtotal).toFixed(2)}`, 500, y + 4, {
            width: 50, align: 'right',
          });
 
        y += 28;
 
        // Separador entre rows
        doc.strokeColor('#F1F5F9').lineWidth(0.3)
          .moveTo(48, y - 4).lineTo(548, y - 4).stroke();
      }
 
      // ═════════════ TOTALES ═════════════
      y += 10;
      doc
        .rect(380, y, 175, 50)
        .fill('#FEF2F2');
 
      doc.fillColor('#64748B').fontSize(9).font('Helvetica')
        .text('Subtotal:', 390, y + 10);
      doc.fillColor('#0F172A').fontSize(9).font('Helvetica-Bold')
        .text(`Bs ${Number(orden.subtotal).toFixed(2)}`, 390, y + 10, {
          width: 155, align: 'right',
        });
 
      doc.fillColor('#E11D48').fontSize(11).font('Helvetica-Bold')
        .text('TOTAL:', 390, y + 28);
      doc.fillColor('#E11D48').fontSize(13).font('Helvetica-Bold')
        .text(`Bs ${Number(orden.total).toFixed(2)}`, 390, y + 26, {
          width: 155, align: 'right',
        });
 
      y += 70;
 
      // ═════════════ NOTAS ═════════════
      if (orden.notas) {
        doc.fillColor('#64748B').fontSize(8).font('Helvetica-Bold')
          .text('NOTAS:', 40, y);
        doc.fillColor('#0F172A').fontSize(9).font('Helvetica')
          .text(orden.notas, 40, y + 12, { width: 500 });
        y += 40;
      }
 
      // ═════════════ FIRMAS ═════════════
      y = Math.max(y, 720);
      const yFirma = Math.min(y, 740);
 
      doc.strokeColor('#94A3B8').lineWidth(0.5)
        .moveTo(80, yFirma).lineTo(230, yFirma).stroke();
      doc.fillColor('#64748B').fontSize(8).font('Helvetica')
        .text('Solicitante', 80, yFirma + 5, { width: 150, align: 'center' });
      if (orden.solicitante) {
        doc.fontSize(8)
          .text(`${orden.solicitante.nombres} ${orden.solicitante.apellido_paterno}`,
            80, yFirma + 18, { width: 150, align: 'center' });
      }
 
      doc.strokeColor('#94A3B8').lineWidth(0.5)
        .moveTo(330, yFirma).lineTo(480, yFirma).stroke();
      doc.fillColor('#64748B').fontSize(8)
        .text('Recibido por', 330, yFirma + 5, { width: 150, align: 'center' });
      if (orden.receptor) {
        doc.fontSize(8)
          .text(`${orden.receptor.nombres} ${orden.receptor.apellido_paterno}`,
            330, yFirma + 18, { width: 150, align: 'center' });
      }
 
      doc.end();
    });
  }
 
  private formatFecha(d: any): string {
    if (!d) return '—';
    const fecha = new Date(d);
    return fecha.toLocaleDateString('es-BO', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  }
 
  private formatEstado(e: string): string {
    const m: Record<string, string> = {
      Pendiente: 'PENDIENTE',
      Recibido_Total: 'RECIBIDO TOTAL',
      Recibido_Parcial: 'RECIBIDO PARCIAL',
      Cancelado: 'CANCELADO',
    };
    return m[e] || e;
  }
 
  private colorEstado(e: string): { bg: string; fg: string } {
    const m: Record<string, { bg: string; fg: string }> = {
      Pendiente:        { bg: '#FEF3C7', fg: '#D97706' },
      Recibido_Total:   { bg: '#D1FAE5', fg: '#059669' },
      Recibido_Parcial: { bg: '#FEF3C7', fg: '#D97706' },
      Cancelado:        { bg: '#FEE2E2', fg: '#DC2626' },
    };
    return m[e] || { bg: '#F1F5F9', fg: '#64748B' };
  }
}