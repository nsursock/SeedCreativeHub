-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "creative_hub";

-- CreateEnum
CREATE TYPE "creative_hub"."UserRole" AS ENUM ('member', 'editor', 'admin');

-- CreateEnum
CREATE TYPE "creative_hub"."UserStatus" AS ENUM ('active', 'suspended', 'deleted');

-- CreateEnum
CREATE TYPE "creative_hub"."ClaimStatus" AS ENUM ('unclaimed', 'pending', 'claimed');

-- CreateEnum
CREATE TYPE "creative_hub"."WorkType" AS ENUM ('text', 'image', 'audio', 'video', 'embed', 'mixed');

-- CreateEnum
CREATE TYPE "creative_hub"."WorkStatus" AS ENUM ('draft', 'published', 'archived', 'hidden');

-- CreateEnum
CREATE TYPE "creative_hub"."MediaKind" AS ENUM ('image', 'audio', 'video', 'file', 'embed');

-- CreateEnum
CREATE TYPE "creative_hub"."ModerationStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "creative_hub"."OpportunityStatus" AS ENUM ('open', 'closed', 'draft');

-- CreateEnum
CREATE TYPE "creative_hub"."RemoteMode" AS ENUM ('onsite', 'remote', 'hybrid');

-- CreateEnum
CREATE TYPE "creative_hub"."CompensationStatus" AS ENUM ('paid', 'unpaid', 'negotiable', 'tbd');

-- CreateEnum
CREATE TYPE "creative_hub"."EventStatus" AS ENUM ('draft', 'published', 'cancelled', 'past');

-- CreateEnum
CREATE TYPE "creative_hub"."ReportStatus" AS ENUM ('open', 'resolved', 'dismissed');

-- CreateEnum
CREATE TYPE "creative_hub"."ReportEntityType" AS ENUM ('profile', 'work', 'opportunity', 'event', 'user');

-- CreateEnum
CREATE TYPE "creative_hub"."EditorialEntityType" AS ENUM ('profile', 'work', 'opportunity', 'event', 'collection');

-- CreateEnum
CREATE TYPE "creative_hub"."NotificationType" AS ENUM ('collab_interest', 'contact_message', 'follow', 'security', 'claim', 'system');

-- CreateTable
CREATE TABLE "creative_hub"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "role" "creative_hub"."UserRole" NOT NULL DEFAULT 'member',
    "status" "creative_hub"."UserStatus" NOT NULL DEFAULT 'active',
    "locale" TEXT NOT NULL DEFAULT 'en',
    "email_verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creative_hub"."profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "handle" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "bio_short" TEXT,
    "bio_long" TEXT,
    "avatar_url" TEXT,
    "cover_url" TEXT,
    "country" TEXT NOT NULL DEFAULT 'Lebanon',
    "city" TEXT,
    "availability" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'public',
    "claim_status" "creative_hub"."ClaimStatus" NOT NULL DEFAULT 'unclaimed',
    "website_url" TEXT,
    "instagram_url" TEXT,
    "verified_at" TIMESTAMP(3),
    "completion_score" INTEGER NOT NULL DEFAULT 0,
    "is_founding" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creative_hub"."disciplines" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "name_fr" TEXT NOT NULL,
    "name_ar" TEXT NOT NULL,
    "name_he" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "disciplines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creative_hub"."profile_disciplines" (
    "profile_id" TEXT NOT NULL,
    "discipline_id" TEXT NOT NULL,

    CONSTRAINT "profile_disciplines_pkey" PRIMARY KEY ("profile_id","discipline_id")
);

-- CreateTable
CREATE TABLE "creative_hub"."cities" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "name_fr" TEXT NOT NULL,
    "name_ar" TEXT NOT NULL,
    "name_he" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creative_hub"."works" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "type" "creative_hub"."WorkType" NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "status" "creative_hub"."WorkStatus" NOT NULL DEFAULT 'draft',
    "primary_discipline_id" TEXT,
    "external_url" TEXT,
    "embed_url" TEXT,
    "published_at" TIMESTAMP(3),
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "works_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creative_hub"."media_assets" (
    "id" TEXT NOT NULL,
    "work_id" TEXT NOT NULL,
    "kind" "creative_hub"."MediaKind" NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'supabase',
    "storage_key" TEXT,
    "public_url" TEXT,
    "external_url" TEXT,
    "mime_type" TEXT,
    "size_bytes" INTEGER,
    "moderation_status" "creative_hub"."ModerationStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creative_hub"."claim_tokens" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,

    CONSTRAINT "claim_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creative_hub"."waitlist_entries" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "display_name" TEXT,
    "disciplines" TEXT[],
    "locale" TEXT NOT NULL DEFAULT 'en',
    "referral_code" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "waitlist_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creative_hub"."magic_links" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "magic_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creative_hub"."follows" (
    "id" TEXT NOT NULL,
    "follower_id" TEXT NOT NULL,
    "following_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "follows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creative_hub"."opportunities" (
    "id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "roles" TEXT,
    "discipline" TEXT,
    "location" TEXT,
    "remote_mode" "creative_hub"."RemoteMode",
    "compensation_status" "creative_hub"."CompensationStatus",
    "deadline" TIMESTAMP(3),
    "status" "creative_hub"."OpportunityStatus" NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creative_hub"."opportunity_interests" (
    "id" TEXT NOT NULL,
    "opportunity_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "opportunity_interests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creative_hub"."events" (
    "id" TEXT NOT NULL,
    "organizer_id" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3),
    "venue" TEXT,
    "city" TEXT,
    "category" TEXT,
    "external_url" TEXT,
    "image_url" TEXT,
    "status" "creative_hub"."EventStatus" NOT NULL DEFAULT 'published',
    "capacity" INTEGER,
    "is_hub_night" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creative_hub"."notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "creative_hub"."NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "payload" JSONB,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creative_hub"."reports" (
    "id" TEXT NOT NULL,
    "reporter_id" TEXT NOT NULL,
    "entity_type" "creative_hub"."ReportEntityType" NOT NULL,
    "entity_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "status" "creative_hub"."ReportStatus" NOT NULL DEFAULT 'open',
    "resolved_by_id" TEXT,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creative_hub"."editorial_features" (
    "id" TEXT NOT NULL,
    "entity_type" "creative_hub"."EditorialEntityType" NOT NULL,
    "entity_id" TEXT NOT NULL,
    "placement" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "starts_at" TIMESTAMP(3),
    "ends_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "editorial_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creative_hub"."audit_logs" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT,
    "action" TEXT NOT NULL,
    "target" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creative_hub"."contact_messages" (
    "id" TEXT NOT NULL,
    "from_user_id" TEXT NOT NULL,
    "to_user_id" TEXT,
    "to_profile_id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "creative_hub"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_user_id_key" ON "creative_hub"."profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_handle_key" ON "creative_hub"."profiles"("handle");

-- CreateIndex
CREATE INDEX "profiles_city_idx" ON "creative_hub"."profiles"("city");

-- CreateIndex
CREATE INDEX "profiles_claim_status_idx" ON "creative_hub"."profiles"("claim_status");

-- CreateIndex
CREATE INDEX "profiles_display_name_idx" ON "creative_hub"."profiles"("display_name");

-- CreateIndex
CREATE UNIQUE INDEX "disciplines_slug_key" ON "creative_hub"."disciplines"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "cities_slug_key" ON "creative_hub"."cities"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "works_slug_key" ON "creative_hub"."works"("slug");

-- CreateIndex
CREATE INDEX "works_status_published_at_idx" ON "creative_hub"."works"("status", "published_at");

-- CreateIndex
CREATE INDEX "works_title_idx" ON "creative_hub"."works"("title");

-- CreateIndex
CREATE UNIQUE INDEX "claim_tokens_token_hash_key" ON "creative_hub"."claim_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "claim_tokens_profile_id_idx" ON "creative_hub"."claim_tokens"("profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "waitlist_entries_email_key" ON "creative_hub"."waitlist_entries"("email");

-- CreateIndex
CREATE UNIQUE INDEX "magic_links_token_hash_key" ON "creative_hub"."magic_links"("token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "follows_follower_id_following_id_key" ON "creative_hub"."follows"("follower_id", "following_id");

-- CreateIndex
CREATE UNIQUE INDEX "opportunities_slug_key" ON "creative_hub"."opportunities"("slug");

-- CreateIndex
CREATE INDEX "opportunities_status_created_at_idx" ON "creative_hub"."opportunities"("status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "opportunity_interests_opportunity_id_user_id_key" ON "creative_hub"."opportunity_interests"("opportunity_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "events_slug_key" ON "creative_hub"."events"("slug");

-- CreateIndex
CREATE INDEX "events_status_starts_at_idx" ON "creative_hub"."events"("status", "starts_at");

-- CreateIndex
CREATE INDEX "notifications_user_id_created_at_idx" ON "creative_hub"."notifications"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "reports_status_created_at_idx" ON "creative_hub"."reports"("status", "created_at");

-- CreateIndex
CREATE INDEX "editorial_features_placement_sort_order_idx" ON "creative_hub"."editorial_features"("placement", "sort_order");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "creative_hub"."audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "creative_hub"."profiles" ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "creative_hub"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creative_hub"."profile_disciplines" ADD CONSTRAINT "profile_disciplines_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "creative_hub"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creative_hub"."profile_disciplines" ADD CONSTRAINT "profile_disciplines_discipline_id_fkey" FOREIGN KEY ("discipline_id") REFERENCES "creative_hub"."disciplines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creative_hub"."works" ADD CONSTRAINT "works_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "creative_hub"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creative_hub"."works" ADD CONSTRAINT "works_primary_discipline_id_fkey" FOREIGN KEY ("primary_discipline_id") REFERENCES "creative_hub"."disciplines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creative_hub"."media_assets" ADD CONSTRAINT "media_assets_work_id_fkey" FOREIGN KEY ("work_id") REFERENCES "creative_hub"."works"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creative_hub"."claim_tokens" ADD CONSTRAINT "claim_tokens_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "creative_hub"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creative_hub"."magic_links" ADD CONSTRAINT "magic_links_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "creative_hub"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creative_hub"."follows" ADD CONSTRAINT "follows_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "creative_hub"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creative_hub"."follows" ADD CONSTRAINT "follows_following_id_fkey" FOREIGN KEY ("following_id") REFERENCES "creative_hub"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creative_hub"."opportunities" ADD CONSTRAINT "opportunities_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "creative_hub"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creative_hub"."opportunity_interests" ADD CONSTRAINT "opportunity_interests_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "creative_hub"."opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creative_hub"."opportunity_interests" ADD CONSTRAINT "opportunity_interests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "creative_hub"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creative_hub"."events" ADD CONSTRAINT "events_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "creative_hub"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creative_hub"."notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "creative_hub"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creative_hub"."reports" ADD CONSTRAINT "reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "creative_hub"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creative_hub"."reports" ADD CONSTRAINT "reports_resolved_by_id_fkey" FOREIGN KEY ("resolved_by_id") REFERENCES "creative_hub"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creative_hub"."audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "creative_hub"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creative_hub"."contact_messages" ADD CONSTRAINT "contact_messages_from_user_id_fkey" FOREIGN KEY ("from_user_id") REFERENCES "creative_hub"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creative_hub"."contact_messages" ADD CONSTRAINT "contact_messages_to_user_id_fkey" FOREIGN KEY ("to_user_id") REFERENCES "creative_hub"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creative_hub"."contact_messages" ADD CONSTRAINT "contact_messages_to_profile_id_fkey" FOREIGN KEY ("to_profile_id") REFERENCES "creative_hub"."profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
