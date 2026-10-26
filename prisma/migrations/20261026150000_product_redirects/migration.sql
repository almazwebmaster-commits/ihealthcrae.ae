-- CreateTable
CREATE TABLE "ProductRedirect" (
    "slug" TEXT NOT NULL,
    "productId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductRedirect_pkey" PRIMARY KEY ("slug")
);

-- CreateIndex
CREATE INDEX "ProductRedirect_productId_idx" ON "ProductRedirect"("productId");

-- AddForeignKey
ALTER TABLE "ProductRedirect" ADD CONSTRAINT "ProductRedirect_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

