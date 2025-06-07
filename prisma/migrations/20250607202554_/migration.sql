-- AlterEnum
ALTER TYPE "TypeTransaction" ADD VALUE 'deposit';

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_payeeId_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_payerId_fkey";

-- AlterTable
ALTER TABLE "Transaction" ALTER COLUMN "payerId" DROP NOT NULL,
ALTER COLUMN "payeeId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_payerId_fkey" FOREIGN KEY ("payerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_payeeId_fkey" FOREIGN KEY ("payeeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
