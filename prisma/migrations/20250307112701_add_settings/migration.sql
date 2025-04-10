-- CreateTable
CREATE TABLE "Settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "cronTime" TEXT NOT NULL DEFAULT '09:00',
    "recipients" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);
