-- CreateEnum
CREATE TYPE "ContestPhase" AS ENUM ('BEFORE', 'CODING', 'PENDING_SYSTEM_TEST', 'SYSTEM_TEST', 'FINISHED');

-- CreateTable
CREATE TABLE "Contest" (
    "id" TEXT NOT NULL,
    "externalId" INTEGER NOT NULL,
    "platform" "Platform" NOT NULL,
    "name" TEXT NOT NULL,
    "phase" "ContestPhase" NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "durationSeconds" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Contest_startTime_idx" ON "Contest"("startTime");

-- CreateIndex
CREATE INDEX "Contest_platform_startTime_idx" ON "Contest"("platform", "startTime");

-- CreateIndex
CREATE UNIQUE INDEX "Contest_platform_externalId_key" ON "Contest"("platform", "externalId");
