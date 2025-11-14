-- CreateTable
CREATE TABLE "Grid" (
    "id" SERIAL NOT NULL,
    "gridNumber" INTEGER NOT NULL,
    "currentGiftType" TEXT,
    "currentParticipantId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'available',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Grid_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" SERIAL NOT NULL,
    "participantNumber" INTEGER NOT NULL,
    "isInitialGift" BOOLEAN NOT NULL DEFAULT false,
    "realParticipantNo" INTEGER,
    "giftType" TEXT NOT NULL,
    "message" TEXT NOT NULL DEFAULT '',
    "name" TEXT NOT NULL DEFAULT '',
    "lineId" TEXT,
    "instagram" TEXT,
    "assignedGridId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Grid_gridNumber_key" ON "Grid"("gridNumber");

-- CreateIndex
CREATE INDEX "Grid_status_idx" ON "Grid"("status");

-- CreateIndex
CREATE INDEX "Grid_currentGiftType_status_idx" ON "Grid"("currentGiftType", "status");

-- CreateIndex
CREATE INDEX "Submission_assignedGridId_idx" ON "Submission"("assignedGridId");

-- CreateIndex
CREATE INDEX "Submission_status_idx" ON "Submission"("status");

-- CreateIndex
CREATE INDEX "Submission_expiresAt_idx" ON "Submission"("expiresAt");

-- CreateIndex
CREATE INDEX "Submission_isInitialGift_idx" ON "Submission"("isInitialGift");

-- CreateIndex
CREATE INDEX "Submission_realParticipantNo_idx" ON "Submission"("realParticipantNo");

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_assignedGridId_fkey" FOREIGN KEY ("assignedGridId") REFERENCES "Grid"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
