-- Admin account locking; compatible with databases that already applied ai_admin.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "isLocked" BOOLEAN NOT NULL DEFAULT false;

-- Catalog rules use a 0..100 suitability scale.
UPDATE "hair_faces" SET "suitabilityScore" = "suitabilityScore" * 100
WHERE "suitabilityScore" > 0 AND "suitabilityScore" <= 1;