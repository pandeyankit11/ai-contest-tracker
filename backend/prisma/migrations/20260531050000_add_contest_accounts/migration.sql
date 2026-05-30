-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('CODEFORCES', 'LEETCODE');

-- CreateTable
CREATE TABLE "ContestAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "handle" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContestAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContestAccount_userId_idx" ON "ContestAccount"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ContestAccount_userId_platform_key" ON "ContestAccount"("userId", "platform");

-- AddForeignKey
ALTER TABLE "ContestAccount" ADD CONSTRAINT "ContestAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
