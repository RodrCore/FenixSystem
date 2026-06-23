"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var VehiculosService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VehiculosService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let VehiculosService = VehiculosService_1 = class VehiculosService {
    prisma;
    logger = new common_1.Logger(VehiculosService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(soloActivos = true) {
        return this.prisma.vehiculo.findMany({
            where: soloActivos ? { activo: true } : {},
            orderBy: { matricula: 'asc' },
        });
    }
    async findOne(id) {
        const v = await this.prisma.vehiculo.findUnique({ where: { id } });
        if (!v)
            throw new common_1.NotFoundException(`Vehículo ${id} no encontrado`);
        return v;
    }
    async create(dto) {
        return this.prisma.vehiculo.create({
            data: {
                matricula: String(dto.matricula).toUpperCase().trim(),
                marca: dto.marca || undefined,
                modelo: dto.modelo || undefined,
                anio: dto.anio ? parseInt(dto.anio) : undefined,
                color: dto.color || undefined,
                tipo: dto.tipo || undefined,
                capacidad_kg: dto.capacidad_kg ? dto.capacidad_kg : undefined,
                notas: dto.notas || undefined,
                activo: true,
            },
        });
    }
    async update(id, dto) {
        await this.findOne(id);
        return this.prisma.vehiculo.update({
            where: { id },
            data: {
                matricula: dto.matricula ? String(dto.matricula).toUpperCase().trim() : undefined,
                marca: dto.marca !== undefined ? dto.marca : undefined,
                modelo: dto.modelo !== undefined ? dto.modelo : undefined,
                anio: dto.anio !== undefined ? parseInt(dto.anio) : undefined,
                color: dto.color !== undefined ? dto.color : undefined,
                tipo: dto.tipo !== undefined ? dto.tipo : undefined,
                capacidad_kg: dto.capacidad_kg !== undefined ? dto.capacidad_kg : undefined,
                notas: dto.notas !== undefined ? dto.notas : undefined,
                activo: dto.activo !== undefined ? Boolean(dto.activo) : undefined,
            },
        });
    }
};
exports.VehiculosService = VehiculosService;
exports.VehiculosService = VehiculosService = VehiculosService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], VehiculosService);
//# sourceMappingURL=vehiculos.service.js.map