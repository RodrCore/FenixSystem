-- AlterTable
ALTER TABLE "pedidos" ADD COLUMN     "deleted_at" TIMESTAMPTZ,
ADD COLUMN     "deleted_by" INTEGER,
ADD COLUMN     "motivo_eliminacion" TEXT;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
