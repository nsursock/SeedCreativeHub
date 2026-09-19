-- AlterTable
ALTER TABLE "creative_hub"."works" ADD COLUMN "ai_generated" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "works_ai_generated_idx" ON "creative_hub"."works"("ai_generated");
