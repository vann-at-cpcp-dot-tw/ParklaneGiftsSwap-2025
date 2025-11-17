-- CreateTable
CREATE TABLE "PendingSubmission" (
    "id" SERIAL NOT NULL,
    "giftType" TEXT NOT NULL,
    "message" TEXT NOT NULL DEFAULT '',
    "name" TEXT NOT NULL,
    "lineId" TEXT,
    "instagram" TEXT,
    "assignedGridId" INTEGER NOT NULL,
    "previousSubmission" JSONB,
    "matchedPreference" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PendingSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PendingSubmission_assignedGridId_idx" ON "PendingSubmission"("assignedGridId");

-- CreateIndex
CREATE INDEX "PendingSubmission_createdAt_idx" ON "PendingSubmission"("createdAt");

-- AddForeignKey
ALTER TABLE "PendingSubmission" ADD CONSTRAINT "PendingSubmission_assignedGridId_fkey" FOREIGN KEY ("assignedGridId") REFERENCES "Grid"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
