"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function main() {
    const passwordHash = await bcrypt.hash('Omar1234', 10);
    const rolPreventista = await prisma.role.findFirst({
        where: { nombre: 'PREVENTISTA' },
    });
    const rolRepartidor = await prisma.role.findFirst({
        where: { nombre: 'REPARTIDOR' },
    });
    if (!rolPreventista || !rolRepartidor) {
        console.error('❌ Los roles PREVENTISTA o REPARTIDOR no existen.');
        console.error('   Ejecuta primero el seed principal.');
        process.exit(1);
    }
    const marioPreventista = await prisma.usuario.upsert({
        where: { email: 'mario.preventista@fenixbd.com' },
        update: {},
        create: {
            nombres: 'Mario',
            apellido_paterno: 'Vargas',
            apellido_materno: 'Quispe',
            email: 'mario.preventista@fenixbd.com',
            password_hash: passwordHash,
            telefono: '+59177998877',
            numero_empleado: 'EMP007',
            salario_base: 3500,
            comision_porcentaje: 5,
            estado: true,
            fecha_contratacion: new Date(),
            rol_id: rolPreventista.id,
        },
    });
    const omarRepartidor = await prisma.usuario.upsert({
        where: { email: 'omar.repartidor@fenixbd.com' },
        update: {},
        create: {
            nombres: 'Omar',
            apellido_paterno: 'Martinez',
            apellido_materno: 'Ramirez',
            email: 'omar.repartidor@fenixbd.com',
            password_hash: passwordHash,
            telefono: '+59177665544',
            numero_empleado: 'EMP008',
            salario_base: 2800,
            comision_porcentaje: 3,
            estado: true,
            fecha_contratacion: new Date(),
            rol_id: rolRepartidor.id,
        },
    });
    console.log('✅ Usuarios creados correctamente:');
    console.log('');
    console.log('   ┌─────────────────────────────────────────────────┐');
    console.log('   │  MARIO PREVENTISTA                               │');
    console.log('   │  Email:    mario.preventista@fenixbd.com         │');
    console.log('   │  Password: Omar1234                             │');
    console.log('   │  ID:      ', marioPreventista.id.toString().padEnd(34), '│');
    console.log('   └─────────────────────────────────────────────────┘');
    console.log('');
    console.log('   ┌─────────────────────────────────────────────────┐');
    console.log('   │  OMAR REPARTIDOR                                │');
    console.log('   │  Email:    omar.repartidor@fenixbd.com          │');
    console.log('   │  Password: Omar1234                             │');
    console.log('   │  ID:      ', omarRepartidor.id.toString().padEnd(34), '│');
    console.log('   └─────────────────────────────────────────────────┘');
}
main()
    .catch(e => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed-omar.js.map