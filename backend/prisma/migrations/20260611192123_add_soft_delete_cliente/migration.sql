-- AlterTable
ALTER TABLE "clientes" ADD COLUMN     "deleted_at" TIMESTAMPTZ,
ADD COLUMN     "deleted_by" INTEGER,
ADD COLUMN     "motivo_eliminacion" TEXT;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
