-- AlterTable
ALTER TABLE "Settings" ADD COLUMN     "domainWarningThreshold" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "sslWarningThreshold" INTEGER NOT NULL DEFAULT 20;
