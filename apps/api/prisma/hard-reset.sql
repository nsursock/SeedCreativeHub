-- Drop Creative Hub schema + any leftover public tables/enums from pre-multi-schema runs.
-- Prisma migrate reset only manages schemas listed in schema.prisma (creative_hub), so
-- public leftovers + public._prisma_migrations can make reset look "successful" while empty.

DROP SCHEMA IF EXISTS "creative_hub" CASCADE;

DROP TABLE IF EXISTS public.contact_messages CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.editorial_features CASCADE;
DROP TABLE IF EXISTS public.reports CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.opportunity_interests CASCADE;
DROP TABLE IF EXISTS public.opportunities CASCADE;
DROP TABLE IF EXISTS public.follows CASCADE;
DROP TABLE IF EXISTS public.magic_links CASCADE;
DROP TABLE IF EXISTS public.waitlist_entries CASCADE;
DROP TABLE IF EXISTS public.claim_tokens CASCADE;
DROP TABLE IF EXISTS public.media_assets CASCADE;
DROP TABLE IF EXISTS public.works CASCADE;
DROP TABLE IF EXISTS public.profile_disciplines CASCADE;
DROP TABLE IF EXISTS public.cities CASCADE;
DROP TABLE IF EXISTS public.disciplines CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public._prisma_migrations CASCADE;

DO $$ DECLARE r record; BEGIN
  FOR r IN
    SELECT typname FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typtype = 'e'
  LOOP
    EXECUTE format('DROP TYPE IF EXISTS public.%I CASCADE', r.typname);
  END LOOP;
END $$;
