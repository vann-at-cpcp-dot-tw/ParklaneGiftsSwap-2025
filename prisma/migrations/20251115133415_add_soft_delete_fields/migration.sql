-- AlterTable
ALTER TABLE "Submission" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Submission_isDeleted_idx" ON "Submission"("isDeleted");

-- CreateIndex
CREATE INDEX "Submission_participantNumber_idx" ON "Submission"("participantNumber");

-- CreateIndex
CREATE INDEX "Submission_assignedGridId_status_completedAt_idx" ON "Submission"("assignedGridId", "status", "completedAt");

-- CreateIndex
CREATE INDEX "Submission_isInitialGift_realParticipantNo_idx" ON "Submission"("isInitialGift", "realParticipantNo");

-- CreateIndex
CREATE INDEX "Submission_assignedGridId_status_completedAt_isDeleted_idx" ON "Submission"("assignedGridId", "status", "completedAt", "isDeleted");
