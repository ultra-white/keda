/*
  Warnings:

  - The `size` column on the `CartItem` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to alter the column `total` on the `Order` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `price` on the `OrderItem` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - The `size` column on the `OrderItem` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `isNew` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `isOnSale` on the `Product` table. All the data in the column will be lost.
  - You are about to alter the column `price` on the `Product` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `oldPrice` on the `Product` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.

*/
-- AlterTable
ALTER TABLE "CartItem" DROP COLUMN "size",
ADD COLUMN     "size" INTEGER NOT NULL DEFAULT 40;

-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "total" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "OrderItem" ALTER COLUMN "price" SET DATA TYPE INTEGER,
DROP COLUMN "size",
ADD COLUMN     "size" INTEGER NOT NULL DEFAULT 40;

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "isNew",
DROP COLUMN "isOnSale",
ALTER COLUMN "price" SET DATA TYPE INTEGER,
ALTER COLUMN "oldPrice" SET DATA TYPE INTEGER;
