-- ============================================
-- Migración SEGURA: Solo agrega columnas nuevas
-- No elimina ni modifica datos existentes
-- ============================================

-- 1. Agregar nuevas columnas a la tabla usuarios existente
ALTER TABLE "usuarios" 
  ADD COLUMN IF NOT EXISTS "ci" VARCHAR(20),
  ADD COLUMN IF NOT EXISTS "ultima_ip" VARCHAR(45),
  ADD COLUMN IF NOT EXISTS "intentos_fallidos_login" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "bloqueado_hasta" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "password_temporal" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "requiere_cambio_password" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "deleted_by" INTEGER,
  ADD COLUMN IF NOT EXISTS "motivo_eliminacion" TEXT;

-- 2. Agregar restricción UNIQUE para CI (si no existe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'usuarios_ci_key' 
    AND conrelid = '"usuarios"'::regclass
  ) THEN
    ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_ci_key" UNIQUE ("ci");
  END IF;
END $$;

-- 3. Agregar índice único para CI (por si acaso)
CREATE UNIQUE INDEX IF NOT EXISTS "usuarios_ci_key_idx" ON "usuarios"("ci");

-- 4. Agregar la self-referencia para soft delete
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'usuarios_deleted_by_fkey' 
    AND conrelid = '"usuarios"'::regclass
  ) THEN
    ALTER TABLE "usuarios" 
      ADD CONSTRAINT "usuarios_deleted_by_fkey" 
      FOREIGN KEY ("deleted_by") REFERENCES "usuarios"("id") 
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- 5. Actualizar el tracking de Prisma (opcional pero recomendado)
-- Esto asegura que Prisma sepa que la migración se aplicó