/*
  Warnings:

  - You are about to drop the `locations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `reports` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `routes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_profiles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "EstadoPedido" AS ENUM ('Borrador', 'Confirmado', 'Preparando', 'Listo_Carga', 'En_Ruta', 'Entregado_Parcial', 'Entregado_Total', 'Cancelado', 'Devuelto');

-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('Efectivo', 'Transferencia', 'Cuenta_Corriente', 'Tarjeta');

-- CreateEnum
CREATE TYPE "EstadoPago" AS ENUM ('Pendiente', 'Parcial', 'Pagado', 'Reembolsado');

-- CreateEnum
CREATE TYPE "TipoMovimiento" AS ENUM ('entrada_inicial', 'venta', 'devolucion', 'merma_vencimiento', 'merma_robo', 'ajuste_inventario');

-- CreateEnum
CREATE TYPE "EstadoLote" AS ENUM ('Disponible', 'Agotado', 'Vencido', 'Cuarentena', 'Mermado');

-- CreateEnum
CREATE TYPE "EstadoCliente" AS ENUM ('Activo', 'Inactivo', 'Moroso', 'Prospecto');

-- CreateEnum
CREATE TYPE "EstadoLineaPedido" AS ENUM ('Pendiente', 'Preparada', 'Entregada', 'Devuelta', 'Cancelada');

-- CreateEnum
CREATE TYPE "TipoCierre" AS ENUM ('Cierre_Turno', 'Cierre_Diario', 'Cierre_Mensual');

-- DropForeignKey
ALTER TABLE "locations" DROP CONSTRAINT "locations_createdByUserId_fkey";

-- DropForeignKey
ALTER TABLE "routes" DROP CONSTRAINT "routes_createdByUserId_fkey";

-- DropForeignKey
ALTER TABLE "user_profiles" DROP CONSTRAINT "user_profiles_userId_fkey";

-- DropTable
DROP TABLE "locations";

-- DropTable
DROP TABLE "reports";

-- DropTable
DROP TABLE "routes";

-- DropTable
DROP TABLE "user_profiles";

-- DropTable
DROP TABLE "users";

-- CreateTable
CREATE TABLE "Role" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "descripcion" TEXT,
    "permisos" JSONB NOT NULL DEFAULT '{}',
    "nivel_jerarquico" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "rol_id" INTEGER NOT NULL,
    "nombres" VARCHAR(100) NOT NULL,
    "apellido_paterno" VARCHAR(50) NOT NULL,
    "apellido_materno" VARCHAR(50),
    "email" VARCHAR(100) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "telefono" VARCHAR(20),
    "avatar_url" TEXT,
    "fecha_contratacion" DATE,
    "numero_empleado" VARCHAR(20),
    "salario_base" DECIMAL(10,2),
    "comision_porcentaje" DECIMAL(5,2) DEFAULT 0,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "ultimo_acceso" TIMESTAMPTZ,
    "refresh_token" TEXT,
    "reset_token" VARCHAR(255),
    "reset_token_expira" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" TEXT,
    "categoria_padre_id" INTEGER,
    "imagen_url" TEXT,
    "orden_visualizacion" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productos" (
    "id" SERIAL NOT NULL,
    "codigo_barras_unidad_base" VARCHAR(50),
    "codigo_interno" VARCHAR(50),
    "nombre" VARCHAR(200) NOT NULL,
    "descripcion_corta" VARCHAR(255),
    "descripcion_larga" TEXT,
    "categoria_id" INTEGER,
    "marca" VARCHAR(100),
    "unidad_medida_base" VARCHAR(20) NOT NULL DEFAULT 'UNIDAD',
    "peso_gramos" DECIMAL(10,2),
    "volumen_mililitros" DECIMAL(10,2),
    "precio_compra_promedio" DECIMAL(10,2),
    "margen_ganancia_porcentaje" DECIMAL(5,2),
    "iva_porcentaje" DECIMAL(5,2) DEFAULT 16.00,
    "ieps_porcentaje" DECIMAL(5,2) DEFAULT 0,
    "stock_minimo" INTEGER NOT NULL DEFAULT 10,
    "stock_maximo" INTEGER NOT NULL DEFAULT 1000,
    "dias_para_alerta_vencimiento" INTEGER NOT NULL DEFAULT 14,
    "imagen_url" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "presentaciones" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "siglas" VARCHAR(10),
    "descripcion" VARCHAR(100),
    "es_presentacion_venta" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "presentaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productos_presentaciones" (
    "id" SERIAL NOT NULL,
    "producto_id" INTEGER NOT NULL,
    "presentacion_id" INTEGER NOT NULL,
    "unidades_equivalentes" DECIMAL(10,2) NOT NULL,
    "precio_venta" DECIMAL(10,2) NOT NULL,
    "precio_mayoreo" DECIMAL(10,2),
    "cantidad_minima_mayoreo" INTEGER NOT NULL DEFAULT 1,
    "codigo_barras_presentacion" VARCHAR(50),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "productos_presentaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proveedores" (
    "id" SERIAL NOT NULL,
    "razon_social" VARCHAR(200) NOT NULL,
    "nombre_comercial" VARCHAR(200),
    "nit_rfc" VARCHAR(20),
    "contacto_nombres" VARCHAR(200),
    "contacto_telefono" VARCHAR(20),
    "contacto_email" VARCHAR(100),
    "direccion_completa" TEXT,
    "latitud" DECIMAL(10,7),
    "longitud" DECIMAL(10,7),
    "dias_entrega" VARCHAR(100),
    "condiciones_pago" VARCHAR(200),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "notas" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proveedores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lotes" (
    "id" SERIAL NOT NULL,
    "producto_id" INTEGER NOT NULL,
    "proveedor_id" INTEGER,
    "codigo_lote" VARCHAR(100) NOT NULL,
    "codigo_proveedor" VARCHAR(100),
    "fecha_ingreso" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_fabricacion" DATE,
    "fecha_vencimiento" DATE NOT NULL,
    "presentacion_recibida_id" INTEGER NOT NULL,
    "cantidad_recibida_presentacion" INTEGER NOT NULL,
    "cantidad_unidades_inicial" INTEGER NOT NULL,
    "cantidad_unidades_disponible" INTEGER NOT NULL,
    "unidades_por_presentacion" INTEGER NOT NULL,
    "costo_unitario" DECIMAL(10,2),
    "costo_total" DECIMAL(12,2),
    "estado" "EstadoLote" NOT NULL DEFAULT 'Disponible',
    "ubicacion_almacen" VARCHAR(50),
    "notas" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rutas" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" TEXT,
    "repartidor_asignado_id" INTEGER,
    "zona_geografica" VARCHAR(100),
    "color_mapa" VARCHAR(7),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rutas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" SERIAL NOT NULL,
    "razon_social" VARCHAR(200) NOT NULL,
    "nombre_comercial" VARCHAR(200),
    "nit_rfc" VARCHAR(20),
    "regimen_fiscal" VARCHAR(100),
    "contacto_nombres" VARCHAR(100),
    "contacto_apellido_paterno" VARCHAR(50),
    "contacto_apellido_materno" VARCHAR(50),
    "contacto_telefono" VARCHAR(20) NOT NULL,
    "contacto_whatsapp" VARCHAR(20),
    "contacto_email" VARCHAR(100),
    "direccion_calle" VARCHAR(200),
    "direccion_numero" VARCHAR(20),
    "direccion_colonia" VARCHAR(100),
    "direccion_ciudad" VARCHAR(100),
    "direccion_codigo_postal" VARCHAR(10),
    "direccion_referencias" TEXT,
    "latitud" DECIMAL(10,7),
    "longitud" DECIMAL(10,7),
    "horario_recepcion_desde" TIME,
    "horario_recepcion_hasta" TIME,
    "dias_entrega" VARCHAR(50),
    "tiempo_promedio_entrega_minutos" INTEGER,
    "preventista_asignado_id" INTEGER,
    "ruta_id" INTEGER,
    "lista_precios_especial" BOOLEAN NOT NULL DEFAULT false,
    "credito_habilitado" BOOLEAN NOT NULL DEFAULT false,
    "limite_credito" DECIMAL(12,2),
    "dias_credito" INTEGER NOT NULL DEFAULT 0,
    "saldo_pendiente" DECIMAL(12,2) DEFAULT 0,
    "tipo_cliente" VARCHAR(50),
    "frecuencia_promedio_dias" INTEGER,
    "valor_promedio_pedido" DECIMAL(12,2),
    "estado" "EstadoCliente" NOT NULL DEFAULT 'Activo',
    "notas_internas" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ruta_clientes" (
    "id" SERIAL NOT NULL,
    "ruta_id" INTEGER NOT NULL,
    "cliente_id" INTEGER NOT NULL,
    "orden_visita" INTEGER NOT NULL,
    "distancia_desde_origen" DECIMAL(10,2),
    "tiempo_estimado_desde_origen" INTEGER,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ruta_clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedidos" (
    "id" SERIAL NOT NULL,
    "numero_pedido" VARCHAR(20) NOT NULL,
    "cliente_id" INTEGER NOT NULL,
    "preventista_id" INTEGER,
    "repartidor_id" INTEGER,
    "ruta_id" INTEGER,
    "estado" "EstadoPedido" NOT NULL DEFAULT 'Borrador',
    "metodo_pago" "MetodoPago" NOT NULL DEFAULT 'Efectivo',
    "estado_pago" "EstadoPago" NOT NULL DEFAULT 'Pendiente',
    "subtotal" DECIMAL(12,2) DEFAULT 0,
    "descuento_general" DECIMAL(10,2) DEFAULT 0,
    "iva_total" DECIMAL(10,2) DEFAULT 0,
    "ieps_total" DECIMAL(10,2) DEFAULT 0,
    "total_monto" DECIMAL(12,2) DEFAULT 0,
    "fecha_creacion" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_confirmacion" TIMESTAMPTZ,
    "fecha_entrega_programada" DATE,
    "fecha_entrega_real" TIMESTAMPTZ,
    "version" INTEGER NOT NULL DEFAULT 1,
    "notas_pedido" TEXT,
    "comprobante_pago_url" TEXT,
    "created_by" INTEGER,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pedidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detalle_pedidos" (
    "id" SERIAL NOT NULL,
    "pedido_id" INTEGER NOT NULL,
    "producto_id" INTEGER NOT NULL,
    "presentacion_id" INTEGER NOT NULL,
    "cantidad_presentacion_solicitada" INTEGER NOT NULL,
    "unidades_equivalentes_totales" INTEGER NOT NULL,
    "precio_unitario_presentacion" DECIMAL(10,2) NOT NULL,
    "subtotal_solicitado" DECIMAL(12,2) NOT NULL,
    "cantidad_presentacion_entregada" INTEGER NOT NULL DEFAULT 0,
    "unidades_equivalentes_entregadas" INTEGER NOT NULL DEFAULT 0,
    "cantidad_presentacion_devuelta" INTEGER NOT NULL DEFAULT 0,
    "motivo_devolucion" TEXT,
    "lote_fifo_utilizado_id" INTEGER,
    "estado_linea" "EstadoLineaPedido" NOT NULL DEFAULT 'Pendiente',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "detalle_pedidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos_inventario" (
    "id" UUID NOT NULL,
    "lote_id" INTEGER NOT NULL,
    "pedido_id" INTEGER,
    "usuario_id" INTEGER,
    "tipo" "TipoMovimiento" NOT NULL,
    "cantidad_unidades" INTEGER NOT NULL,
    "stock_anterior" INTEGER NOT NULL,
    "stock_resultante" INTEGER NOT NULL,
    "motivo" TEXT,
    "costo_unitario" DECIMAL(10,2),
    "costo_total" DECIMAL(12,2),
    "fecha_movimiento" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_inventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lista_precios_clientes" (
    "id" SERIAL NOT NULL,
    "cliente_id" INTEGER NOT NULL,
    "producto_presentacion_id" INTEGER NOT NULL,
    "precio_especial" DECIMAL(10,2) NOT NULL,
    "vigencia_desde" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vigencia_hasta" DATE,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lista_precios_clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promociones" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(200) NOT NULL,
    "descripcion" TEXT,
    "tipo_promocion" VARCHAR(50) NOT NULL,
    "producto_condicion_id" INTEGER,
    "cantidad_minima_condicion" INTEGER,
    "presentacion_condicion_id" INTEGER,
    "producto_beneficio_id" INTEGER,
    "cantidad_beneficio" INTEGER,
    "presentacion_beneficio_id" INTEGER,
    "descuento_porcentaje" DECIMAL(5,2),
    "descuento_monto" DECIMAL(10,2),
    "aplica_a_todos_clientes" BOOLEAN NOT NULL DEFAULT false,
    "cliente_especifico_id" INTEGER,
    "fecha_inicio" TIMESTAMPTZ NOT NULL,
    "fecha_fin" TIMESTAMPTZ NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promociones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cortes_caja" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "tipo_corte" "TipoCierre" NOT NULL,
    "fecha_apertura" TIMESTAMPTZ NOT NULL,
    "fecha_cierre" TIMESTAMPTZ,
    "efectivo_inicial" DECIMAL(12,2) DEFAULT 0,
    "efectivo_final" DECIMAL(12,2),
    "efectivo_esperado" DECIMAL(12,2),
    "diferencia" DECIMAL(12,2),
    "total_ventas_efectivo" DECIMAL(12,2) DEFAULT 0,
    "total_ventas_transferencia" DECIMAL(12,2) DEFAULT 0,
    "total_ventas_tarjeta" DECIMAL(12,2) DEFAULT 0,
    "total_ventas_credito" DECIMAL(12,2) DEFAULT 0,
    "total_ventas" DECIMAL(12,2) DEFAULT 0,
    "total_devoluciones" DECIMAL(12,2) DEFAULT 0,
    "total_gastos" DECIMAL(12,2) DEFAULT 0,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'Abierto',
    "notas" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cortes_caja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditoria_logs" (
    "id" UUID NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "sesion_id" UUID,
    "accion" VARCHAR(50) NOT NULL,
    "modulo" VARCHAR(50),
    "tabla_afectada" VARCHAR(100),
    "registro_id" VARCHAR(100),
    "valor_anterior" JSONB,
    "valor_nuevo" JSONB,
    "ip_origen" INET,
    "user_agent" TEXT,
    "dispositivo" VARCHAR(100),
    "navegador" VARCHAR(100),
    "fecha_hora" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditoria_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metas_comerciales" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "tipo_meta" VARCHAR(50) NOT NULL,
    "monto_objetivo" DECIMAL(12,2),
    "cantidad_objetivo" INTEGER,
    "periodo_inicio" DATE NOT NULL,
    "periodo_fin" DATE NOT NULL,
    "monto_alcanzado" DECIMAL(12,2) DEFAULT 0,
    "cantidad_alcanzada" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "metas_comerciales_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_nombre_key" ON "Role"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_numero_empleado_key" ON "usuarios"("numero_empleado");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_nombre_key" ON "categorias"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "productos_codigo_barras_unidad_base_key" ON "productos"("codigo_barras_unidad_base");

-- CreateIndex
CREATE UNIQUE INDEX "productos_codigo_interno_key" ON "productos"("codigo_interno");

-- CreateIndex
CREATE UNIQUE INDEX "presentaciones_nombre_key" ON "presentaciones"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "presentaciones_siglas_key" ON "presentaciones"("siglas");

-- CreateIndex
CREATE UNIQUE INDEX "productos_presentaciones_codigo_barras_presentacion_key" ON "productos_presentaciones"("codigo_barras_presentacion");

-- CreateIndex
CREATE UNIQUE INDEX "productos_presentaciones_producto_id_presentacion_id_key" ON "productos_presentaciones"("producto_id", "presentacion_id");

-- CreateIndex
CREATE UNIQUE INDEX "proveedores_nit_rfc_key" ON "proveedores"("nit_rfc");

-- CreateIndex
CREATE UNIQUE INDEX "lotes_producto_id_codigo_lote_key" ON "lotes"("producto_id", "codigo_lote");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_nit_rfc_key" ON "clientes"("nit_rfc");

-- CreateIndex
CREATE UNIQUE INDEX "ruta_clientes_ruta_id_cliente_id_key" ON "ruta_clientes"("ruta_id", "cliente_id");

-- CreateIndex
CREATE UNIQUE INDEX "ruta_clientes_ruta_id_orden_visita_key" ON "ruta_clientes"("ruta_id", "orden_visita");

-- CreateIndex
CREATE UNIQUE INDEX "pedidos_numero_pedido_key" ON "pedidos"("numero_pedido");

-- CreateIndex
CREATE UNIQUE INDEX "lista_precios_clientes_cliente_id_producto_presentacion_id_key" ON "lista_precios_clientes"("cliente_id", "producto_presentacion_id");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categorias" ADD CONSTRAINT "categorias_categoria_padre_id_fkey" FOREIGN KEY ("categoria_padre_id") REFERENCES "categorias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos_presentaciones" ADD CONSTRAINT "productos_presentaciones_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos_presentaciones" ADD CONSTRAINT "productos_presentaciones_presentacion_id_fkey" FOREIGN KEY ("presentacion_id") REFERENCES "presentaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lotes" ADD CONSTRAINT "lotes_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lotes" ADD CONSTRAINT "lotes_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "proveedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lotes" ADD CONSTRAINT "lotes_presentacion_recibida_id_fkey" FOREIGN KEY ("presentacion_recibida_id") REFERENCES "presentaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rutas" ADD CONSTRAINT "rutas_repartidor_asignado_id_fkey" FOREIGN KEY ("repartidor_asignado_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_preventista_asignado_id_fkey" FOREIGN KEY ("preventista_asignado_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_ruta_id_fkey" FOREIGN KEY ("ruta_id") REFERENCES "rutas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ruta_clientes" ADD CONSTRAINT "ruta_clientes_ruta_id_fkey" FOREIGN KEY ("ruta_id") REFERENCES "rutas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ruta_clientes" ADD CONSTRAINT "ruta_clientes_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_preventista_id_fkey" FOREIGN KEY ("preventista_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_repartidor_id_fkey" FOREIGN KEY ("repartidor_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_ruta_id_fkey" FOREIGN KEY ("ruta_id") REFERENCES "rutas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_pedidos" ADD CONSTRAINT "detalle_pedidos_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "pedidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_pedidos" ADD CONSTRAINT "detalle_pedidos_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_pedidos" ADD CONSTRAINT "detalle_pedidos_presentacion_id_fkey" FOREIGN KEY ("presentacion_id") REFERENCES "presentaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_pedidos" ADD CONSTRAINT "detalle_pedidos_lote_fifo_utilizado_id_fkey" FOREIGN KEY ("lote_fifo_utilizado_id") REFERENCES "lotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_lote_id_fkey" FOREIGN KEY ("lote_id") REFERENCES "lotes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "pedidos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lista_precios_clientes" ADD CONSTRAINT "lista_precios_clientes_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lista_precios_clientes" ADD CONSTRAINT "lista_precios_clientes_producto_presentacion_id_fkey" FOREIGN KEY ("producto_presentacion_id") REFERENCES "productos_presentaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promociones" ADD CONSTRAINT "promociones_producto_condicion_id_fkey" FOREIGN KEY ("producto_condicion_id") REFERENCES "productos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promociones" ADD CONSTRAINT "promociones_presentacion_condicion_id_fkey" FOREIGN KEY ("presentacion_condicion_id") REFERENCES "presentaciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promociones" ADD CONSTRAINT "promociones_producto_beneficio_id_fkey" FOREIGN KEY ("producto_beneficio_id") REFERENCES "productos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promociones" ADD CONSTRAINT "promociones_presentacion_beneficio_id_fkey" FOREIGN KEY ("presentacion_beneficio_id") REFERENCES "presentaciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promociones" ADD CONSTRAINT "promociones_cliente_especifico_id_fkey" FOREIGN KEY ("cliente_especifico_id") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cortes_caja" ADD CONSTRAINT "cortes_caja_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria_logs" ADD CONSTRAINT "auditoria_logs_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metas_comerciales" ADD CONSTRAINT "metas_comerciales_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
