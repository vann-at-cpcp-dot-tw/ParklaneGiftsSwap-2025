-- AlterTable
ALTER TABLE "Grid" ADD COLUMN     "disabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Grid_disabled_idx" ON "Grid"("disabled");
