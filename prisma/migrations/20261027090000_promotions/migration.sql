-- CreateEnum
CREATE TYPE "CouponType" AS ENUM ('PERCENT', 'FIXED', 'FREE_DELIVERY');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "couponCode" TEXT,
ADD COLUMN     "couponDiscount" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "flashEndsAt" TIMESTAMP(3),
ADD COLUMN     "flashPct" INTEGER,
ADD COLUMN     "flashStartsAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Coupon" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "descriptionEn" TEXT NOT NULL DEFAULT '',
    "descriptionAr" TEXT NOT NULL DEFAULT '',
    "type" "CouponType" NOT NULL,
    "value" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "maxDiscount" DECIMAL(10,2),
    "minSpend" DECIMAL(10,2),
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "usageLimit" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "perCustomerLimit" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CouponRedemption" (
    "id" SERIAL NOT NULL,
    "couponId" INTEGER NOT NULL,
    "orderId" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CouponRedemption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon"("code");

-- CreateIndex
CREATE UNIQUE INDEX "CouponRedemption_orderId_key" ON "CouponRedemption"("orderId");

-- CreateIndex
CREATE INDEX "CouponRedemption_couponId_email_idx" ON "CouponRedemption"("couponId", "email");

-- CreateIndex
CREATE INDEX "Product_flashEndsAt_idx" ON "Product"("flashEndsAt");

-- AddForeignKey
ALTER TABLE "CouponRedemption" ADD CONSTRAINT "CouponRedemption_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponRedemption" ADD CONSTRAINT "CouponRedemption_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

