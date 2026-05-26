-- Add version column to branch_stocks for optimistic locking
ALTER TABLE "branch_stocks" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;
