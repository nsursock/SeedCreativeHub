-- Align WorkType with GraphQL / shared enums (text|image|audio|video).
-- Remap legacy embed/mixed rows before shrinking the Postgres enum.

UPDATE "creative_hub"."works" w
SET "type" = 'video'
FROM "creative_hub"."disciplines" d
WHERE w."primary_discipline_id" = d."id"
  AND w."type"::text = 'embed'
  AND d."slug" = 'film';

UPDATE "creative_hub"."works" w
SET "type" = 'audio'
FROM "creative_hub"."disciplines" d
WHERE w."primary_discipline_id" = d."id"
  AND w."type"::text = 'embed'
  AND d."slug" = 'music';

UPDATE "creative_hub"."works" w
SET "type" = 'image'
FROM "creative_hub"."disciplines" d
WHERE w."primary_discipline_id" = d."id"
  AND w."type"::text = 'embed'
  AND d."slug" = 'photography';

UPDATE "creative_hub"."works" w
SET "type" = 'text'
FROM "creative_hub"."disciplines" d
WHERE w."primary_discipline_id" = d."id"
  AND w."type"::text = 'embed'
  AND d."slug" = 'writing';

UPDATE "creative_hub"."works"
SET "type" = 'video'
WHERE "type"::text = 'embed'
  AND ("title" ILIKE '%film%' OR "title" ILIKE '%video%');

UPDATE "creative_hub"."works"
SET "type" = 'audio'
WHERE "type"::text = 'embed'
  AND ("title" ILIKE '%music%' OR "title" ILIKE '%audio%' OR "title" ILIKE '%beat%');

UPDATE "creative_hub"."works"
SET "type" = 'text'
WHERE "type"::text = 'embed'
  AND ("title" ILIKE '%writ%' OR "title" ILIKE '%poem%' OR "title" ILIKE '%essay%');

-- Remaining legacy embed/mixed (old disciplines like design/crafts) → image
UPDATE "creative_hub"."works"
SET "type" = 'image'
WHERE "type"::text IN ('embed', 'mixed');

ALTER TYPE "creative_hub"."WorkType" RENAME TO "WorkType_old";
CREATE TYPE "creative_hub"."WorkType" AS ENUM ('text', 'image', 'audio', 'video');
ALTER TABLE "creative_hub"."works" ALTER COLUMN "type" TYPE "creative_hub"."WorkType" USING ("type"::text::"creative_hub"."WorkType");
DROP TYPE "creative_hub"."WorkType_old";
