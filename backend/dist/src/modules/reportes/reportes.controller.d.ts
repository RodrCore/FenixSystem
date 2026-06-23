import type { Response } from 'express';
import { ReportesService } from './reportes.service';
export declare class ReportesController {
    private reportes;
    constructor(reportes: ReportesService);
    dataPreventista(q: any, req: any): Promise<import("./reportes.service").ReportePreventista>;
    pdfPreventista(q: any, req: any, res: Response): Promise<void>;
    dataRepartidor(q: any, req: any): Promise<import("./reportes.service").ReporteRepartidor>;
    pdfRepartidor(q: any, req: any, res: Response): Promise<void>;
    private validarMesAnio;
}
