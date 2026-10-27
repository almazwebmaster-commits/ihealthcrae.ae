-- AlterTable
ALTER TABLE "user" ADD COLUMN     "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[];


-- Existing staff keep access to every section they had before.
UPDATE "user" SET "permissions" = ARRAY['dashboard','orders','customers','products','inventory','promotions','homepage'] WHERE "role" = 'staff';
