-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAUSED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "deliveryMethod" TEXT NOT NULL DEFAULT 'standard',
ADD COLUMN     "stripePaymentIntentId" TEXT,
ADD COLUMN     "subscriptionId" INTEGER;

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "stripeCustomerId" TEXT;

-- CreateTable
CREATE TABLE "Subscription" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" INTEGER NOT NULL,
    "option" INTEGER NOT NULL DEFAULT -1,
    "qty" INTEGER NOT NULL,
    "intervalWeeks" INTEGER NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "nextDeliveryAt" TIMESTAMP(3) NOT NULL,
    "stripePaymentMethodId" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "emirate" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "street" TEXT,
    "building" TEXT NOT NULL,
    "unit" TEXT,
    "landmark" TEXT,
    "lastError" TEXT,
    "createdFromOrderId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Subscription_status_nextDeliveryAt_idx" ON "Subscription"("status", "nextDeliveryAt");

-- CreateIndex
CREATE INDEX "Subscription_userId_idx" ON "Subscription"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_stripePaymentIntentId_key" ON "Order"("stripePaymentIntentId");

-- CreateIndex
CREATE UNIQUE INDEX "user_stripeCustomerId_key" ON "user"("stripeCustomerId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

