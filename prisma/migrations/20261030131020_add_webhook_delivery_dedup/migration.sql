/*
  Warnings:

  - A unique constraint covering the columns `[activeKey]` on the table `Review` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "WebhookDeliveryStatus" AS ENUM ('RECEIVED', 'PROCESSING', 'QUEUED', 'IGNORED', 'FAILED');

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "activeKey" TEXT,
ADD COLUMN     "headSha" TEXT;

-- CreateTable
CREATE TABLE "GitHubWebhookDelivery" (
    "id" TEXT NOT NULL,
    "deliveryId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "action" TEXT,
    "repositoryGithubId" INTEGER,
    "prNumber" INTEGER,
    "reviewId" TEXT,
    "status" "WebhookDeliveryStatus" NOT NULL DEFAULT 'RECEIVED',
    "error" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GitHubWebhookDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GitHubWebhookDelivery_deliveryId_key" ON "GitHubWebhookDelivery"("deliveryId");

-- CreateIndex
CREATE INDEX "GitHubWebhookDelivery_status_updatedAt_idx" ON "GitHubWebhookDelivery"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "GitHubWebhookDelivery_repositoryGithubId_prNumber_idx" ON "GitHubWebhookDelivery"("repositoryGithubId", "prNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Review_activeKey_key" ON "Review"("activeKey");
