-- Align WorkType with GraphQL / shared enums (text|image|audio|video).
-- Remap legacy embed/mixed rows before shrinking the Postgres enum.

UPDATE "works" w
SET "type" = 'video'
FROM "disciplines" d
WHERE w."primary_discipline_id" = d."id"
  AND w."type"::text = 'embed'
  AND d."slug" = 'film';

UPDATE "works" w
SET "type" = 'audio'
FROM "disciplines" d
WHERE w."primary_discipline_id" = d."id"
  AND w."type"::text = 'embed'
  AND d."slug" = 'music';

UPDATE "works" w
SET "type" = 'image'
FROM "disciplines" d
WHERE w."primary_discipline_id" = d."id"
  AND w."type"::text = 'embed'
  AND d."slug" = 'photography';

UPDATE "works" w
SET "type" = 'text'
FROM "disciplines" d
WHERE w."primary_discipline_id" = d."id"
  AND w."type"::text = 'embed'
  AND d."slug" = 'writing';

UPDATE "works"
SET "type" = 'video'
WHERE "type"::text = 'embed'
  AND ("title" ILIKE '%film%' OR "title" ILIKE '%video%');

UPDATE "works"
SET "type" = 'audio'
WHERE "type"::text = 'embed'
  AND ("title" ILIKE '%music%' OR "title" ILIKE '%audio%' OR "title" ILIKE '%beat%');

UPDATE "works"
SET "type" = 'text'
WHERE "type"::text = 'embed'
  AND ("title" ILIKE '%writ%' OR "title" ILIKE '%poem%' OR "title" ILIKE '%essay%');

-- Remaining legacy embed/mixed (old disciplines like design/crafts) → image
UPDATE "works"
SET "type" = 'image'
WHERE "type"::text IN ('embed', 'mixed');

ALTER TYPE "WorkType" RENAME TO "WorkType_old";
CREATE TYPE "WorkType" AS ENUM ('text', 'image', 'audio', 'video');
ALTER TABLE "works" ALTER COLUMN "type" TYPE "WorkType" USING ("type"::text::"WorkType");
DROP TYPE "WorkType_old";
