import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

@Injectable()
export class BoletasService {
  private readonly logger = new Logger(BoletasService.name);

  constructor(private prisma: PrismaService) {}

  // ── Generar boleta PDF ───────────────────────────────────
  async generarBoletaPDF(
    pedidoId: number,
    usuarioId: number,
    rolNombre: string,
  ): Promise<{ buffer: Buffer; filename: string }> {
    const pedido = await this.prisma.pedido.findUnique({
      where: { id: pedidoId },
      include: {
        cliente: true,
        preventista: {
          select: { id: true, nombres: true, apellido_paterno: true },
        },
        detalles: {
          include: {
            producto: { select: { nombre: true } },
            presentacion: { select: { nombre: true } },
          },
        },
      },
    });

    if (!pedido) throw new NotFoundException('Pedido no encontrado');

    // ── Validación de permisos ──
    const esAdmin = ['SUPER_ADMIN', 'ADMIN', 'GERENTE'].includes(rolNombre);
    if (!esAdmin && rolNombre === 'PREVENTISTA') {
      if (pedido.preventista_id !== usuarioId) {
        throw new ForbiddenException(
          'No puedes generar boleta de pedidos ajenos',
        );
      }
    }
    if (rolNombre === 'REPARTIDOR') {
      throw new ForbiddenException('El repartidor no puede generar boletas');
    }

    // ── Crear documento ──
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    const finish = new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });

    // ═══════════════════════════════════════════════════════
    // HEADER — Logo y datos de la empresa
    // ═══════════════════════════════════════════════════════

    // Cuadro rojo lateral izquierdo
    doc.rect(50, 50, 4, 80).fill('#E11D48');

    // Título empresa
    doc
      .fillColor('#0F172A')
      .font('Helvetica-Bold')
      .fontSize(22)
      .text('FENIX', 70, 55);

    doc
      .fillColor('#64748B')
      .font('Helvetica')
      .fontSize(9)
      .text('Sistema de Distribución Comercial', 70, 82)
      .text('La Paz, Bolivia', 70, 95)
      .text('NIT: 1234567890', 70, 108);

    // BOLETA texto a la derecha
    doc
      .fillColor('#E11D48')
      .font('Helvetica-Bold')
      .fontSize(18)
      .text('BOLETA DE VENTA', 350, 55, { width: 200, align: 'right' });

    doc
      .fillColor('#0F172A')
      .font('Helvetica-Bold')
      .fontSize(11)
      .text(pedido.numero_pedido, 350, 82, { width: 200, align: 'right' });

    doc
      .fillColor('#64748B')
      .font('Helvetica')
      .fontSize(9)
      .text(this.formatearFecha(pedido.fecha_creacion), 350, 100, {
        width: 200,
        align: 'right',
      });

    // Línea separadora
    doc
      .strokeColor('#E2E8F0')
      .lineWidth(0.5)
      .moveTo(50, 145)
      .lineTo(545, 145)
      .stroke();

    // ═══════════════════════════════════════════════════════
    // DATOS DEL CLIENTE
    // ═══════════════════════════════════════════════════════
    let y = 165;
    doc
      .fillColor('#94A3B8')
      .font('Helvetica-Bold')
      .fontSize(8)
      .text('CLIENTE', 50, y, { characterSpacing: 1 });
    y += 14;
    doc
      .fillColor('#0F172A')
      .font('Helvetica-Bold')
      .fontSize(11)
      .text(pedido.cliente.razon_social, 50, y);
    y += 14;

    if (pedido.cliente.nombre_comercial) {
      doc
        .fillColor('#64748B')
        .font('Helvetica')
        .fontSize(9)
        .text(pedido.cliente.nombre_comercial, 50, y);
      y += 12;
    }
    if (pedido.cliente.nit_rfc) {
      doc.text(`NIT: ${pedido.cliente.nit_rfc}`, 50, y);
      y += 12;
    }
    if (pedido.cliente.direccion_calle) {
      doc.text(
        `${pedido.cliente.direccion_calle} ${pedido.cliente.direccion_numero ?? ''}`,
        50,
        y,
      );
      y += 12;
    }
    if (pedido.cliente.direccion_ciudad) {
      doc.text(pedido.cliente.direccion_ciudad, 50, y);
      y += 12;
    }
    if (pedido.cliente.contacto_telefono) {
      doc.text(`Tel: ${pedido.cliente.contacto_telefono}`, 50, y);
      y += 12;
    }

    // ── Lado derecho: vendedor ──
    let yDerecha = 165;
    doc
      .fillColor('#94A3B8')
      .font('Helvetica-Bold')
      .fontSize(8)
      .text('VENDEDOR', 350, yDerecha, { characterSpacing: 1 });
    yDerecha += 14;

    if (pedido.preventista) {
      doc
        .fillColor('#0F172A')
        .font('Helvetica-Bold')
        .fontSize(11)
        .text(
          `${pedido.preventista.nombres} ${pedido.preventista.apellido_paterno ?? ''}`,
          350,
          yDerecha,
        );
      yDerecha += 14;
    }

    doc
      .fillColor('#94A3B8')
      .font('Helvetica-Bold')
      .fontSize(8)
      .text('PAGO', 350, yDerecha + 4, { characterSpacing: 1 });
    yDerecha += 18;
    doc
      .fillColor('#0F172A')
      .font('Helvetica')
      .fontSize(10)
      .text(pedido.metodo_pago.replace(/_/g, ' '), 350, yDerecha);

    // ═══════════════════════════════════════════════════════
    // TABLA DE PRODUCTOS
    // ═══════════════════════════════════════════════════════
    y = Math.max(y, yDerecha) + 30;

    // Encabezado de tabla
    doc.rect(50, y, 495, 22).fill('#F8FAFC');
    doc
      .fillColor('#475569')
      .font('Helvetica-Bold')
      .fontSize(8)
      .text('PRODUCTO', 60, y + 7, { characterSpacing: 0.5 })
      .text('PRESENT.', 280, y + 7, { width: 60, align: 'left' })
      .text('CANT.', 345, y + 7, { width: 40, align: 'right' })
      .text('P. UNIT.', 390, y + 7, { width: 60, align: 'right' })
      .text('SUBTOTAL', 455, y + 7, { width: 80, align: 'right' });
    y += 26;

    // Filas
    for (const d of pedido.detalles) {
      doc
        .fillColor('#0F172A')
        .font('Helvetica')
        .fontSize(9)
        .text(d.producto?.nombre ?? '', 60, y, { width: 220 })
        .text(d.presentacion?.nombre ?? '', 280, y, { width: 60 })
        .text(String(d.cantidad_presentacion_solicitada), 345, y, {
          width: 40,
          align: 'right',
        })
        .text(
          `Bs ${Number(d.precio_unitario_presentacion).toFixed(2)}`,
          390,
          y,
          { width: 60, align: 'right' },
        )
        .text(`Bs ${Number(d.subtotal_solicitado).toFixed(2)}`, 455, y, {
          width: 80,
          align: 'right',
        });

      y += 18;
      doc
        .strokeColor('#F1F5F9')
        .lineWidth(0.5)
        .moveTo(50, y)
        .lineTo(545, y)
        .stroke();
      y += 4;
    }

    // ═══════════════════════════════════════════════════════
    // TOTALES
    // ═══════════════════════════════════════════════════════
    y += 20;
    const xLabel = 380;
    const xValue = 545;
    const lineH = 16;

    doc
      .fillColor('#64748B')
      .font('Helvetica')
      .fontSize(10)
      .text('Subtotal', xLabel, y, { width: 100, align: 'right' })
      .fillColor('#0F172A')
      .font('Helvetica-Bold')
      .text(`Bs ${Number(pedido.subtotal).toFixed(2)}`, xLabel, y, {
        width: 165,
        align: 'right',
      });
    y += lineH;

    if (Number(pedido.descuento_general) > 0) {
      doc
        .fillColor('#64748B')
        .font('Helvetica')
        .text('Descuento', xLabel, y, { width: 100, align: 'right' })
        .fillColor('#DC2626')
        .font('Helvetica-Bold')
        .text(
          `- Bs ${Number(pedido.descuento_general).toFixed(2)}`,
          xLabel,
          y,
          { width: 165, align: 'right' },
        );
      y += lineH;
    }

    if (Number(pedido.iva_total) > 0) {
      doc
        .fillColor('#64748B')
        .font('Helvetica')
        .text('IVA', xLabel, y, { width: 100, align: 'right' })
        .fillColor('#0F172A')
        .font('Helvetica-Bold')
        .text(`Bs ${Number(pedido.iva_total).toFixed(2)}`, xLabel, y, {
          width: 165,
          align: 'right',
        });
      y += lineH;
    }

    if (Number(pedido.ieps_total) > 0) {
      doc
        .fillColor('#64748B')
        .font('Helvetica')
        .text('IEPS', xLabel, y, { width: 100, align: 'right' })
        .fillColor('#0F172A')
        .font('Helvetica-Bold')
        .text(`Bs ${Number(pedido.ieps_total).toFixed(2)}`, xLabel, y, {
          width: 165,
          align: 'right',
        });
      y += lineH;
    }

    // Total final
    y += 6;
    doc.rect(xLabel - 5, y - 2, 175, 24).fill('#FEF2F2');
    doc
      .fillColor('#E11D48')
      .font('Helvetica-Bold')
      .fontSize(13)
      .text('TOTAL', xLabel, y + 5, { width: 100, align: 'right' })
      .text(`Bs ${Number(pedido.total_monto).toFixed(2)}`, xLabel, y + 5, {
        width: 165,
        align: 'right',
      });

    // ═══════════════════════════════════════════════════════
    // FOOTER
    // ═══════════════════════════════════════════════════════
    const footerY = 750;
    doc
      .strokeColor('#E2E8F0')
      .lineWidth(0.5)
      .moveTo(50, footerY)
      .lineTo(545, footerY)
      .stroke();

    doc
      .fillColor('#94A3B8')
      .font('Helvetica')
      .fontSize(8)
      .text(
        `Documento generado el ${new Date().toLocaleString('es-BO')} · Fenix · Sistema de gestión`,
        50,
        footerY + 8,
        { width: 495, align: 'center' },
      );

    doc.end();
    const buffer = await finish;

    return {
      buffer,
      filename: `boleta-${pedido.numero_pedido}.pdf`,
    };
  }

  private formatearFecha(d: Date): string {
    return new Date(d).toLocaleDateString('es-BO', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }
}
