import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
 
const prisma = new PrismaClient();
 
async function main() {
  const passwordHash = await bcrypt.hash('Omar1234', 10);
 
  // Buscar los roles
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
 
  // ── Mario Preventista ──
  const marioPreventista = await prisma.usuario.upsert({
    where: { email: 'mario.preventista@fenixbd.com' },
    update: {},
    create: {
      nombres:           'Mario',
      apellido_paterno:  'Vargas',
      apellido_materno:  'Quispe',
      email:             'mario.preventista@fenixbd.com',
      password_hash:     passwordHash,
      telefono:          '+59177998877',
      numero_empleado:   'EMP007',
      salario_base:      3500,
      comision_porcentaje: 5,
      estado:            true,
      fecha_contratacion: new Date(),
      rol_id:            rolPreventista.id,
    },
  });
 
  // ── Omar Repartidor ──
  const omarRepartidor = await prisma.usuario.upsert({
    where: { email: 'omar.repartidor@fenixbd.com' },
    update: {},
    create: {
      nombres:           'Omar',
      apellido_paterno:  'Martinez',
      apellido_materno:  'Ramirez',
      email:             'omar.repartidor@fenixbd.com',
      password_hash:     passwordHash,
      telefono:          '+59177665544',
      numero_empleado:   'EMP008',
      salario_base:      2800,
      comision_porcentaje: 3,
      estado:            true,
      fecha_contratacion: new Date(),
      rol_id:            rolRepartidor.id,
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
