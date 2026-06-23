import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de datos...\n');

  try {
    // =============================================
    // CREAR ROLES CON PERMISOS
    // =============================================

    console.log('📋 Creando roles con permisos...');

    // SUPER_ADMIN - Control total
    const superAdminPermisos = {
      usuarios: {
        crear: true,
        leer: true,
        editar: true,
        eliminar: true,
        crear_admin: true,
        cambiar_rol: true,
      },
      productos: {
        crear: true,
        leer: true,
        editar: true,
        eliminar: true,
      },
      clientes: {
        crear: true,
        leer: true,
        editar: true,
        eliminar: true,
      },
      pedidos: {
        crear: true,
        leer: true,
        editar: true,
        eliminar: true,
        confirmar: true,
        entregar: true,
      },
      reportes: {
        leer: true,
      },
      auditoria: {
        leer: true,
      },
      corte_caja: {
        crear: true,
        leer: true,
        editar: true,
      },
    };

    const rolSuperAdmin = await prisma.role.upsert({
      where: { nombre: 'SUPER_ADMIN' },
      update: { permisos: superAdminPermisos },
      create: {
        nombre: 'SUPER_ADMIN',
        descripcion: 'Administrador supremo del sistema',
        permisos: superAdminPermisos,
        nivel_jerarquico: 0,
        activo: true,
      },
    });

    console.log('  ✅ SUPER_ADMIN creado/actualizado');

    // ADMIN - Administrador (sin ver auditoría)
    const adminPermisos = {
      usuarios: {
        crear: true,
        leer: true,
        editar: true,
        eliminar: false,
        crear_admin: false,
        cambiar_rol: false,
      },
      productos: {
        crear: true,
        leer: true,
        editar: true,
        eliminar: false,
      },
      clientes: {
        crear: true,
        leer: true,
        editar: true,
        eliminar: false,
      },
      pedidos: {
        crear: true,
        leer: true,
        editar: true,
        eliminar: false,
        confirmar: true,
        entregar: false,
      },
      reportes: {
        leer: true,
      },
      auditoria: {
        leer: false,
      },
      corte_caja: {
        crear: true,
        leer: true,
        editar: false,
      },
    };

    const rolAdmin = await prisma.role.upsert({
      where: { nombre: 'ADMIN' },
      update: { permisos: adminPermisos },
      create: {
        nombre: 'ADMIN',
        descripcion: 'Administrador del sistema',
        permisos: adminPermisos,
        nivel_jerarquico: 1,
        activo: true,
      },
    });

    console.log('  ✅ ADMIN creado/actualizado');

    // GERENTE - Puede crear productos
    const gerentePermisos = {
      usuarios: {
        crear: false,
        leer: true,
        editar: false,
        eliminar: false,
        crear_admin: false,
        cambiar_rol: false,
      },
      productos: {
        crear: true,
        leer: true,
        editar: true,
        eliminar: false,
      },
      clientes: {
        crear: true,
        leer: true,
        editar: true,
        eliminar: false,
      },
      pedidos: {
        crear: true,
        leer: true,
        editar: true,
        eliminar: false,
        confirmar: true,
        entregar: false,
      },
      reportes: {
        leer: true,
      },
      auditoria: {
        leer: false,
      },
      corte_caja: {
        crear: true,
        leer: true,
        editar: false,
      },
    };

    const rolGerente = await prisma.role.upsert({
      where: { nombre: 'GERENTE' },
      update: { permisos: gerentePermisos },
      create: {
        nombre: 'GERENTE',
        descripcion: 'Gerente de operaciones',
        permisos: gerentePermisos,
        nivel_jerarquico: 2,
        activo: true,
      },
    });

    console.log('  ✅ GERENTE creado/actualizado');

    // PREVENTISTA - Vendedor
    const preventistaPermisos = {
      usuarios: { crear: false, leer: false, editar: false, eliminar: false, crear_admin: false, cambiar_rol: false },
      productos: { crear: false, leer: true, editar: false, eliminar: false },
      clientes: { crear: true, leer: true, editar: true, eliminar: false },
      pedidos: { crear: true, leer: true, editar: true, eliminar: false, confirmar: false, entregar: false },
      reportes: { leer: true },
      auditoria: { leer: false },
      corte_caja: { crear: false, leer: true, editar: false },
    };

    const rolPreventista = await prisma.role.upsert({
      where: { nombre: 'PREVENTISTA' },
      update: { permisos: preventistaPermisos },
      create: {
        nombre: 'PREVENTISTA',
        descripcion: 'Personal de preventa/vendedor',
        permisos: preventistaPermisos,
        nivel_jerarquico: 3,
        activo: true,
      },
    });

    console.log('  ✅ PREVENTISTA creado/actualizado');

    // ALMACEN - Personal de almacén
    const almacenPermisos = {
      usuarios: { crear: false, leer: false, editar: false, eliminar: false, crear_admin: false, cambiar_rol: false },
      productos: { crear: true, leer: true, editar: true, eliminar: false },
      clientes: { crear: false, leer: true, editar: false, eliminar: false },
      pedidos: { crear: false, leer: true, editar: false, eliminar: false, confirmar: false, entregar: false },
      reportes: { leer: false },
      auditoria: { leer: false },
      corte_caja: { crear: false, leer: false, editar: false },
    };

    const rolAlmacen = await prisma.role.upsert({
      where: { nombre: 'ALMACEN' },
      update: { permisos: almacenPermisos },
      create: {
        nombre: 'ALMACEN',
        descripcion: 'Personal de almacén',
        permisos: almacenPermisos,
        nivel_jerarquico: 4,
        activo: true,
      },
    });

    console.log('  ✅ ALMACEN creado/actualizado');

    // REPARTIDOR - Personal de reparto
    const repartidorPermisos = {
      usuarios: { crear: false, leer: false, editar: false, eliminar: false, crear_admin: false, cambiar_rol: false },
      productos: { crear: false, leer: true, editar: false, eliminar: false },
      clientes: { crear: false, leer: true, editar: false, eliminar: false },
      pedidos: { crear: false, leer: true, editar: false, eliminar: false, confirmar: false, entregar: true },
      reportes: { leer: false },
      auditoria: { leer: false },
      corte_caja: { crear: false, leer: false, editar: false },
    };

    const rolRepartidor = await prisma.role.upsert({
      where: { nombre: 'REPARTIDOR' },
      update: { permisos: repartidorPermisos },
      create: {
        nombre: 'REPARTIDOR',
        descripcion: 'Personal de reparto/entregas',
        permisos: repartidorPermisos,
        nivel_jerarquico: 5,
        activo: true,
      },
    });

    console.log('  ✅ REPARTIDOR creado/actualizado\n');

    // =============================================
    // CREAR USUARIOS
    // =============================================

    console.log('👥 Creando usuarios...\n');

    // SUPER_ADMIN: rodrcore
    const passwordSuperAdmin = await bcrypt.hash('FenixAdmin2025!', 10);

    const usuarioSuperAdmin = await prisma.usuario.upsert({
      where: { email: 'rodrcore@fenixbd.com' },
      update: {},
      create: {
        rol_id: rolSuperAdmin.id,
        nombres: 'Rodrigo',
        apellido_paterno: 'Core',
        apellido_materno: 'System',
        email: 'rodrcore@fenixbd.com',
        password_hash: passwordSuperAdmin,
        numero_empleado: 'EMP001',
        estado: true,
      },
    });

    console.log('  ✅ SUPER_ADMIN (rodrcore) creado');
    console.log('     📧 Email: rodrcore@fenixbd.com');
    console.log('     🔑 Password: FenixAdmin2025!\n');

    // ADMIN: Juan Administrador
    const passwordAdmin = await bcrypt.hash('AdminFenix2025!', 10);

    const usuarioAdmin = await prisma.usuario.upsert({
      where: { email: 'juan.admin@fenixbd.com' },
      update: {},
      create: {
        rol_id: rolAdmin.id,
        nombres: 'Juan',
        apellido_paterno: 'Pérez',
        apellido_materno: 'García',
        email: 'juan.admin@fenixbd.com',
        password_hash: passwordAdmin,
        numero_empleado: 'EMP002',
        telefono: '+56912345678',
        estado: true,
      },
    });

    console.log('  ✅ ADMIN (Juan Pérez) creado');
    console.log('     📧 Email: juan.admin@fenixbd.com');
    console.log('     🔑 Password: AdminFenix2025!\n');

    // GERENTE: Carlos Gerente
    const passwordGerente = await bcrypt.hash('GerenteFenix2025!', 10);

    const usuarioGerente = await prisma.usuario.upsert({
      where: { email: 'carlos.gerente@fenixbd.com' },
      update: {},
      create: {
        rol_id: rolGerente.id,
        nombres: 'Carlos',
        apellido_paterno: 'López',
        apellido_materno: 'Mendoza',
        email: 'carlos.gerente@fenixbd.com',
        password_hash: passwordGerente,
        numero_empleado: 'EMP003',
        telefono: '+56987654321',
        salario_base: new Decimal('2500000'),
        comision_porcentaje: new Decimal('5.0'),
        estado: true,
      },
    });

    console.log('  ✅ GERENTE (Carlos López) creado');
    console.log('     📧 Email: carlos.gerente@fenixbd.com');
    console.log('     🔑 Password: GerenteFenix2025!\n');

    // PREVENTISTA: María Vendedora
    const passwordPreventista = await bcrypt.hash('VendedorFenix2025!', 10);

    const usuarioPreventista = await prisma.usuario.upsert({
      where: { email: 'maria.vendedora@fenixbd.com' },
      update: {},
      create: {
        rol_id: rolPreventista.id,
        nombres: 'María',
        apellido_paterno: 'Rodríguez',
        apellido_materno: 'Silva',
        email: 'maria.vendedora@fenixbd.com',
        password_hash: passwordPreventista,
        numero_empleado: 'EMP004',
        telefono: '+56998765432',
        salario_base: new Decimal('1800000'),
        comision_porcentaje: new Decimal('8.0'),
        estado: true,
      },
    });

    console.log('  ✅ PREVENTISTA (María Rodríguez) creado');
    console.log('     📧 Email: maria.vendedora@fenixbd.com');
    console.log('     🔑 Password: VendedorFenix2025!\n');

    // ALMACEN: Roberto Almacenero
    const passwordAlmacen = await bcrypt.hash('AlmacenFenix2025!', 10);

    const usuarioAlmacen = await prisma.usuario.upsert({
      where: { email: 'roberto.almacen@fenixbd.com' },
      update: {},
      create: {
        rol_id: rolAlmacen.id,
        nombres: 'Roberto',
        apellido_paterno: 'Martínez',
        apellido_materno: 'González',
        email: 'roberto.almacen@fenixbd.com',
        password_hash: passwordAlmacen,
        numero_empleado: 'EMP005',
        telefono: '+56988776655',
        salario_base: new Decimal('1600000'),
        estado: true,
      },
    });

    console.log('  ✅ ALMACEN (Roberto Martínez) creado');
    console.log('     📧 Email: roberto.almacen@fenixbd.com');
    console.log('     🔑 Password: AlmacenFenix2025!\n');

    // REPARTIDOR: David Repartidor
    const passwordRepartidor = await bcrypt.hash('RepartidorFenix2025!', 10);

    const usuarioRepartidor = await prisma.usuario.upsert({
      where: { email: 'david.repartidor@fenixbd.com' },
      update: {},
      create: {
        rol_id: rolRepartidor.id,
        nombres: 'David',
        apellido_paterno: 'Sánchez',
        apellido_materno: 'Torres',
        email: 'david.repartidor@fenixbd.com',
        password_hash: passwordRepartidor,
        numero_empleado: 'EMP006',
        telefono: '+56977665544',
        salario_base: new Decimal('1400000'),
        comision_porcentaje: new Decimal('3.0'),
        estado: true,
      },
    });

    console.log('  ✅ REPARTIDOR (David Sánchez) creado');
    console.log('     📧 Email: david.repartidor@fenixbd.com');
    console.log('     🔑 Password: RepartidorFenix2025!\n');

    // =============================================
    // RESUMEN
    // =============================================

    console.log('═══════════════════════════════════════════════');
    console.log('✅ SEED COMPLETADO EXITOSAMENTE');
    console.log('═══════════════════════════════════════════════\n');

    console.log('📋 ROLES CREADOS:');
    console.log('  1. SUPER_ADMIN - Control total');
    console.log('  2. ADMIN - Administrador (sin ver auditoría)');
    console.log('  3. GERENTE - Puede crear productos');
    console.log('  4. PREVENTISTA - Vendedor/preventa');
    console.log('  5. ALMACEN - Personal de almacén');
    console.log('  6. REPARTIDOR - Personal de reparto\n');

    console.log('👥 USUARIOS CREADOS:');
    console.log('  1. rodrcore@fenixbd.com (SUPER_ADMIN)');
    console.log('  2. juan.admin@fenixbd.com (ADMIN)');
    console.log('  3. carlos.gerente@fenixbd.com (GERENTE)');
    console.log('  4. maria.vendedora@fenixbd.com (PREVENTISTA)');
    console.log('  5. roberto.almacen@fenixbd.com (ALMACEN)');
    console.log('  6. david.repartidor@fenixbd.com (REPARTIDOR)\n');

    console.log('🔑 Todas las contraseñas siguen el patrón: [RolFenix2025!]');
    console.log('   Excepto SUPER_ADMIN: FenixAdmin2025!\n');

  } catch (error) {
    if (error instanceof Error) {
      console.error('❌ Error durante el seed:', error.message);
    } else {
      console.error('❌ Error durante el seed:', JSON.stringify(error));
    }
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});