-- AlterEnum
ALTER TYPE "Platform" ADD VALUE 'CODECHEF';

-- CreateTable
CREATE TABLE "RatingSnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "rating" INTEGER,
    "maxRating" INTEGER,
    "rank" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RatingSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SolvedProblem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contestId" TEXT,
    "platform" "Platform" NOT NULL,
    "externalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "difficulty" TEXT,
    "rating" INTEGER,
    "solvedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SolvedProblem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContestParticipation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contestId" TEXT,
    "platform" "Platform" NOT NULL,
    "externalContestId" TEXT NOT NULL,
    "rank" INTEGER,
    "oldRating" INTEGER,
    "newRating" INTEGER,
    "ratingChange" INTEGER,
    "problemsSolved" INTEGER NOT NULL DEFAULT 0,
    "penalty" INTEGER,
    "participatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContestParticipation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RatingSnapshot_userId_platform_recordedAt_idx" ON "RatingSnapshot"("userId", "platform", "recordedAt");

-- CreateIndex
CREATE INDEX "RatingSnapshot_platform_recordedAt_idx" ON "RatingSnapshot"("platform", "recordedAt");

-- CreateIndex
CREATE UNIQUE INDEX "RatingSnapshot_userId_platform_recordedAt_key" ON "RatingSnapshot"("userId", "platform", "recordedAt");

-- CreateIndex
CREATE INDEX "SolvedProblem_userId_platform_solvedAt_idx" ON "SolvedProblem"("userId", "platform", "solvedAt");

-- CreateIndex
CREATE INDEX "SolvedProblem_platform_solvedAt_idx" ON "SolvedProblem"("platform", "solvedAt");

-- CreateIndex
CREATE INDEX "SolvedProblem_contestId_idx" ON "SolvedProblem"("contestId");

-- CreateIndex
CREATE INDEX "SolvedProblem_platform_difficulty_idx" ON "SolvedProblem"("platform", "difficulty");

-- CreateIndex
CREATE INDEX "SolvedProblem_platform_rating_idx" ON "SolvedProblem"("platform", "rating");

-- CreateIndex
CREATE UNIQUE INDEX "SolvedProblem_userId_platform_externalId_key" ON "SolvedProblem"("userId", "platform", "externalId");

-- CreateIndex
CREATE INDEX "ContestParticipation_userId_platform_participatedAt_idx" ON "ContestParticipation"("userId", "platform", "participatedAt");

-- CreateIndex
CREATE INDEX "ContestParticipation_platform_participatedAt_idx" ON "ContestParticipation"("platform", "participatedAt");

-- CreateIndex
CREATE INDEX "ContestParticipation_contestId_idx" ON "ContestParticipation"("contestId");

-- CreateIndex
CREATE INDEX "ContestParticipation_userId_platform_ratingChange_idx" ON "ContestParticipation"("userId", "platform", "ratingChange");

-- CreateIndex
CREATE UNIQUE INDEX "ContestParticipation_userId_platform_externalContestId_key" ON "ContestParticipation"("userId", "platform", "externalContestId");

-- AddForeignKey
ALTER TABLE "RatingSnapshot" ADD CONSTRAINT "RatingSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolvedProblem" ADD CONSTRAINT "SolvedProblem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolvedProblem" ADD CONSTRAINT "SolvedProblem_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "Contest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContestParticipation" ADD CONSTRAINT "ContestParticipation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContestParticipation" ADD CONSTRAINT "ContestParticipation_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "Contest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
