export declare class PdfExporterService {
    exportar(seccion: string, data: any): Promise<Buffer>;
    private tituloPorSeccion;
    private encabezado;
    private kpiBox;
    private seccionTitulo;
    private tabla;
    private pdfVentas;
    private pdfPedidos;
    private pdfReabastecimientos;
    private pdfInventario;
    private pdfComercial;
    private pdfClientes;
}
