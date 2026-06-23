export declare class ExcelExporterService {
    exportar(seccion: string, data: any): Promise<Buffer>;
    private setHeaderRow;
    private setKPIsHeader;
    private hojaVentas;
    private hojaPedidos;
    private hojaReabastecimientos;
    private hojaInventario;
    private hojaComercial;
    private hojaClientes;
}
