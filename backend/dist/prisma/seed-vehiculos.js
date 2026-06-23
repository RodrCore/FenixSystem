"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const vehiculos = [
        {
            matricula: '2345-BOL',
            marca: 'Toyota',
            modelo: 'Hilux',
            anio: 2020,
            color: 'Rojo',
            tipo: 'Camioneta',
            capacidad_kg: 1000,
            activo: true,
            notas: 'Vehículo principal de reparto',
        },
        {
            matricula: '1876-POT',
            marca: 'Nissan',
            modelo: 'Frontier',
            anio: 2019,
            color: 'Blanco',
            tipo: 'Camioneta',
            capacidad_kg: 900,
            activo: true,
            notas: 'Vehículo secundario de reparto',
        },
    ];
    for (const v of vehiculos) {
        const creado = await prisma.vehiculo.upsert({
            where: { matricula: v.matricula },
            update: {},
            create: v,
        });
        console.log(`✅ ${creado.color} — ${creado.marca} ${creado.modelo} (${creado.matricula})`);
    }
    console.log('\n✅ Vehículos registrados correctamente');
}
main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=seed-vehiculos.js.map