CREATE INDEX IF NOT EXISTS "lotes_estado_idx" ON "lotes"("estado");
CREATE INDEX IF NOT EXISTS "lotes_fecha_vencimiento_idx" ON "lotes"("fecha_vencimiento");
CREATE INDEX IF NOT EXISTS "lotes_producto_id_estado_idx" ON "lotes"("producto_id", "estado");
CREATE INDEX IF NOT EXISTS "lotes_producto_id_idx" ON "lotes"("producto_id");
CREATE INDEX IF NOT EXISTS "productos_activo_categoria_id_idx" ON "productos"("activo", "categoria_id");
CREATE INDEX IF NOT EXISTS "productos_activo_idx" ON "productos"("activo");
CREATE INDEX IF NOT EXISTS "productos_categoria_id_idx" ON "productos"("categoria_id");
CREATE INDEX IF NOT EXISTS "productos_marca_idx" ON "productos"("marca");
CREATE INDEX IF NOT EXISTS "productos_nombre_activo_idx" ON "productos"("nombre", "activo");
CREATE INDEX IF NOT EXISTS "productos_nombre_idx" ON "productos"("nombre");

-- Crear tabla vehiculos
CREATE TABLE IF NOT EXISTS "vehiculos" (
    "id" SERIAL NOT NULL,
    "matricula" VARCHAR(20) NOT NULL,
    "marca" VARCHAR(50),
    "modelo" VARCHAR(50),
    "anio" INTEGER,
    "color" VARCHAR(30),
    "tipo" VARCHAR(30),
    "capacidad_kg" DECIMAL(8,2),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "notas" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "vehiculos_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "vehiculos_matricula_key" ON "vehiculos"("matricula");

-- Agregar vehiculo_id a pedidos
ALTER TABLE "pedidos" ADD COLUMN IF NOT EXISTS "vehiculo_id" INTEGER;

ALTER TABLE "pedidos" DROP CONSTRAINT IF EXISTS "pedidos_vehiculo_id_fkey";
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_vehiculo_id_fkey"
    FOREIGN KEY ("vehiculo_id") REFERENCES "vehiculos"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
