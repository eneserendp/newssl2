-- CreateTable
CREATE TABLE "MonitoredDomain" (
    "id" SERIAL NOT NULL,
    "domain" TEXT NOT NULL,
    "sslInfo" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonitoredDomain_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MonitoredDomain_domain_key" ON "MonitoredDomain"("domain");
