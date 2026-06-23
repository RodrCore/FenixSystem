-- CreateEnum
CREATE TYPE "EstadoReabastecimiento" AS ENUM ('Pendiente', 'Recibido_Parcial', 'Recibido_Total', 'Cancelado');

-- CreateTable
CREATE TABLE "ordenes_reabastecimiento" (
    "id" SERIAL NOT NULL,
    "numero_orden" VARCHAR(20) NOT NULL,
    "proveedor_id" INTEGER NOT NULL,
    "estado" "EstadoReabastecimiento" NOT NULL DEFAULT 'Pendiente',
    "fecha_solicitud" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_recepcion" TIMESTAMPTZ,
    "fecha_esperada" DATE,
    "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "notas" TEXT,
    "solicitado_por_id" INTEGER NOT NULL,
    "recibido_por_id" INTEGER,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" INTEGER,
    "motivo_eliminacion" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ordenes_reabastecimiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detalle_reabastecimiento" (
    "id" SERIAL NOT NULL,
    "orden_id" INTEGER NOT NULL,
    "producto_presentacion_id" INTEGER NOT NULL,
    "cantidad_solicitada" INTEGER NOT NULL,
    "cantidad_recibida" INTEGER NOT NULL DEFAULT 0,
    "precio_unitario_compra" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "detalle_reabastecimiento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ordenes_reabastecimiento_numero_orden_key" ON "ordenes_reabastecimiento"("numero_orden");

-- AddForeignKey
ALTER TABLE "ordenes_reabastecimiento" ADD CONSTRAINT "ordenes_reabastecimiento_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "proveedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_reabastecimiento" ADD CONSTRAINT "ordenes_reabastecimiento_solicitado_por_id_fkey" FOREIGN KEY ("solicitado_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_reabastecimiento" ADD CONSTRAINT "ordenes_reabastecimiento_recibido_por_id_fkey" FOREIGN KEY ("recibido_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_reabastecimiento" ADD CONSTRAINT "ordenes_reabastecimiento_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_reabastecimiento" ADD CONSTRAINT "detalle_reabastecimiento_orden_id_fkey" FOREIGN KEY ("orden_id") REFERENCES "ordenes_reabastecimiento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_reabastecimiento" ADD CONSTRAINT "detalle_reabastecimiento_producto_presentacion_id_fkey" FOREIGN KEY ("producto_presentacion_id") REFERENCES "productos_presentaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
