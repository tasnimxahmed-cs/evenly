/*
  Warnings:

  - Added the required column `plaidAccessToken` to the `bank_accounts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."bank_accounts" ADD COLUMN     "plaidAccessToken" TEXT NOT NULL;
