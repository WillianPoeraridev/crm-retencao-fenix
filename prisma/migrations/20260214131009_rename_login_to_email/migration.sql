/*
  Warnings:

  - You are about to drop the column `login` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[email]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `email` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Competencia_ano_mes_idx";

-- AlterTable (sem perder dados)
ALTER TABLE "User" RENAME COLUMN "login" TO "email";

-- RenameIndex (opcional)
ALTER INDEX IF EXISTS "User_login_key" RENAME TO "User_email_key";
