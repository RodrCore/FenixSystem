import type { Response } from 'express';
import { BoletasService } from './boletas.service';
export declare class BoletasController {
    private boletasService;
    constructor(boletasService: BoletasService);
    generar(id: number, req: any, res: Response): Promise<void>;
}
