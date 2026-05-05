-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('INDIVIDUAL', 'COMPANY');

-- CreateEnum
CREATE TYPE "UserLevel" AS ENUM ('FREE', 'VIP', 'PLATINUM', 'PRESTIGE');

-- CreateEnum
CREATE TYPE "CompanyStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "CompanyRegistrationType" AS ENUM ('ONG', 'SARL', 'SAS', 'SASU', 'EURL', 'SA', 'SNC', 'SCS', 'ASSOCIATION', 'FONDATION', 'GIE', 'COOPERATIVE', 'AUTO_ENTREPRENEUR', 'OTHER');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "password" TEXT,
    "supabase_id" TEXT,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "verification_code" TEXT,
    "verification_code_expiry" TIMESTAMP(3),
    "reset_password_code" TEXT,
    "reset_password_code_expiry" TIMESTAMP(3),
    "provider" TEXT NOT NULL DEFAULT 'email',
    "is_profile_completed" BOOLEAN NOT NULL DEFAULT false,
    "is_profile_terminated" BOOLEAN NOT NULL DEFAULT false,
    "skip_profile_setup" BOOLEAN NOT NULL DEFAULT false,
    "is_preference_completed" BOOLEAN NOT NULL DEFAULT false,
    "is_preference_terminated" BOOLEAN NOT NULL DEFAULT false,
    "skip_preference_setup" BOOLEAN NOT NULL DEFAULT false,
    "admin_created" BOOLEAN NOT NULL DEFAULT false,
    "must_change_password" BOOLEAN NOT NULL DEFAULT false,
    "is_first_login" BOOLEAN NOT NULL DEFAULT true,
    "level" "UserLevel" NOT NULL DEFAULT 'FREE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "actions" (
    "id" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menus" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "path" TEXT,
    "icon" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "parent_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "user_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id","role_id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "role_id" TEXT NOT NULL,
    "permission_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "permission_actions" (
    "permission_id" TEXT NOT NULL,
    "action_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permission_actions_pkey" PRIMARY KEY ("permission_id","action_id")
);

-- CreateTable
CREATE TABLE "menu_permissions" (
    "menu_id" TEXT NOT NULL,
    "permission_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "menu_permissions_pkey" PRIMARY KEY ("menu_id","permission_id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "type" TEXT NOT NULL DEFAULT 'direct',
    "avatar_url" TEXT,
    "created_by_id" TEXT NOT NULL,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_participants" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_read_at" TIMESTAMP(3),
    "is_muted" BOOLEAN NOT NULL DEFAULT false,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "conversation_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "content_encrypted" TEXT,
    "content_iv" TEXT,
    "type" TEXT NOT NULL DEFAULT 'TEXT',
    "reply_to_id" TEXT,
    "is_edited" BOOLEAN NOT NULL DEFAULT false,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_media" (
    "id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "filename" TEXT,
    "mime_type" TEXT,
    "size" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "duration" INTEGER,
    "thumbnail_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_reactions" (
    "id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_read_receipts" (
    "id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "read_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_read_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "friendships" (
    "id" TEXT NOT NULL,
    "initiator_id" TEXT NOT NULL,
    "receiver_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "friendships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posts" (
    "id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "content" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'public',
    "category_id" TEXT,
    "edited_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_views" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "viewer_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_media" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "mime_type" TEXT,
    "size" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "duration" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reaction_types" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "reaction_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reactions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type_id" TEXT NOT NULL,
    "post_id" TEXT,
    "comment_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "parent_id" TEXT,
    "edited_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stories" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "views_count" INTEGER NOT NULL DEFAULT 0,
    "reactions_count" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "is_expired" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "story_slides" (
    "id" TEXT NOT NULL,
    "story_id" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "type" TEXT NOT NULL,
    "media_url" TEXT,
    "thumbnail_url" TEXT,
    "mime_type" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "duration" INTEGER,
    "text_content" TEXT,
    "bg_color" TEXT,
    "text_color" TEXT DEFAULT '#FFFFFF',
    "font_size" TEXT DEFAULT 'medium',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "story_slides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "story_views" (
    "id" TEXT NOT NULL,
    "story_id" TEXT NOT NULL,
    "viewer_id" TEXT NOT NULL,
    "viewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "story_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "story_reactions" (
    "id" TEXT NOT NULL,
    "story_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "story_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preferences" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "age_min" INTEGER,
    "age_max" INTEGER,
    "height_min" DOUBLE PRECISION,
    "height_max" DOUBLE PRECISION,
    "weight_min" DOUBLE PRECISION,
    "weight_max" DOUBLE PRECISION,
    "smoker_preference" TEXT,
    "alcohol_preference" TEXT,
    "has_children_preference" TEXT,
    "wants_children_preference" TEXT,
    "has_pets_preference" TEXT,
    "love_animals_preference" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preference_genders" (
    "id" TEXT NOT NULL,
    "preference_id" TEXT NOT NULL,
    "gender_code" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "preference_genders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preference_skin_tones" (
    "id" TEXT NOT NULL,
    "preference_id" TEXT NOT NULL,
    "skin_tone_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "preference_skin_tones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preference_relationship_statuses" (
    "id" TEXT NOT NULL,
    "preference_id" TEXT NOT NULL,
    "relationship_status_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "preference_relationship_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preference_sexual_orientations" (
    "id" TEXT NOT NULL,
    "preference_id" TEXT NOT NULL,
    "sexual_orientation_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "preference_sexual_orientations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preference_education_levels" (
    "id" TEXT NOT NULL,
    "preference_id" TEXT NOT NULL,
    "education_level_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "preference_education_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preference_personality_types" (
    "id" TEXT NOT NULL,
    "preference_id" TEXT NOT NULL,
    "personality_type_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "preference_personality_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preference_zodiac_signs" (
    "id" TEXT NOT NULL,
    "preference_id" TEXT NOT NULL,
    "zodiac_sign_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "preference_zodiac_signs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preference_religions" (
    "id" TEXT NOT NULL,
    "preference_id" TEXT NOT NULL,
    "religion_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "preference_religions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preference_residence_countries" (
    "id" TEXT NOT NULL,
    "preference_id" TEXT NOT NULL,
    "country_code" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "preference_residence_countries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preference_interests" (
    "id" TEXT NOT NULL,
    "preference_id" TEXT NOT NULL,
    "interest_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "preference_interests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preference_nationalities" (
    "id" TEXT NOT NULL,
    "preference_id" TEXT NOT NULL,
    "country_code" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "preference_nationalities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preference_cities" (
    "id" TEXT NOT NULL,
    "preference_id" TEXT NOT NULL,
    "city_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "preference_cities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profils" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "pseudo" TEXT,
    "birthdate" TIMESTAMP(3),
    "gender" TEXT,
    "profile_photo_url" TEXT,
    "sexual_orientation" TEXT,
    "relationship_status" TEXT,
    "bio" TEXT,
    "height" DOUBLE PRECISION,
    "weight" DOUBLE PRECISION,
    "skin_tone" TEXT,
    "education_level" TEXT,
    "study_place" TEXT,
    "job_title" TEXT,
    "company_name" TEXT,
    "country_origin_code" TEXT,
    "country_residence_code" TEXT,
    "city_id" TEXT,
    "smoker" TEXT,
    "alcohol" TEXT,
    "has_children" TEXT,
    "wants_children" TEXT,
    "has_pets" TEXT,
    "personality_type" TEXT,
    "zodiac_sign" TEXT,
    "religion" TEXT,
    "love_animals" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profils_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "legal_email" TEXT NOT NULL,
    "country" TEXT,
    "registration_type" "CompanyRegistrationType",
    "legal_representative" TEXT,
    "legal_address" TEXT,
    "registration_document_url" TEXT,
    "logo_url" TEXT,
    "status" "CompanyStatus" NOT NULL DEFAULT 'PENDING',
    "is_legal_details_completed" BOOLEAN NOT NULL DEFAULT false,
    "is_documents_completed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interest_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "interest_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interests" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,

    CONSTRAINT "interests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "religions" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "religions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zodiac_signs" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "zodiac_signs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sexual_orientations" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "sexual_orientations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "relationship_statuses" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "relationship_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skin_tones" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "skin_tones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personality_types" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "personality_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "education_levels" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "education_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profil_interests" (
    "id" TEXT NOT NULL,
    "profil_id" TEXT NOT NULL,
    "interest_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profil_interests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nationalities" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name_fr" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "flag" TEXT NOT NULL,

    CONSTRAINT "nationalities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profil_nationalities" (
    "id" TEXT NOT NULL,
    "profil_id" TEXT NOT NULL,
    "nationality_id" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profil_nationalities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "state_code" TEXT NOT NULL,
    "state_name" TEXT NOT NULL,
    "country_code" TEXT NOT NULL,
    "country_name" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,

    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "currencies" (
    "code" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "currencies_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "subscription_types" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price_month" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "price_year" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency_id" TEXT NOT NULL,
    "color" TEXT,
    "icon" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_features" (
    "id" TEXT NOT NULL,
    "subscription_type_id" TEXT NOT NULL,
    "feature_key" TEXT NOT NULL,
    "feature_value" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_subscriptions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "subscription_type_id" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "auto_renew" BOOLEAN NOT NULL DEFAULT false,
    "stripe_subscription_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_history" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "subscription_type_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "price_paid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency_code" TEXT,
    "stripe_subscription_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stripe_customers" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "stripe_customer_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stripe_customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stripe_payment_methods" (
    "id" TEXT NOT NULL,
    "stripe_customer_id" TEXT NOT NULL,
    "stripe_payment_method_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "last4" TEXT,
    "brand" TEXT,
    "exp_month" INTEGER,
    "exp_year" INTEGER,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stripe_payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stripe_invoices" (
    "id" TEXT NOT NULL,
    "stripe_customer_id" TEXT NOT NULL,
    "stripe_invoice_id" TEXT NOT NULL,
    "stripe_subscription_id" TEXT,
    "amount_paid" DOUBLE PRECISION NOT NULL,
    "currency_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "hosted_invoice_url" TEXT,
    "invoice_pdf" TEXT,
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stripe_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_scores" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "target_user_id" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "matched_criteria" JSONB,
    "total_criteria" INTEGER NOT NULL,
    "is_bidirectional" BOOLEAN NOT NULL DEFAULT false,
    "bidirectional_score" INTEGER,
    "last_calculated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "match_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_likes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_categories" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "reporter_id" TEXT NOT NULL,
    "reported_user_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "admin_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "reviewer_id" TEXT NOT NULL,
    "reviewed_user_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "club_subscriptions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_date" TIMESTAMP(3),
    "stripe_subscription_id" TEXT,
    "stripe_customer_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "auto_renew" BOOLEAN NOT NULL DEFAULT true,
    "period" TEXT NOT NULL,
    "price_paid" DOUBLE PRECISION NOT NULL,
    "currency_code" TEXT NOT NULL DEFAULT 'XOF',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "club_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "club_subscription_history" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "price_paid" DOUBLE PRECISION NOT NULL,
    "currency_code" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "stripe_subscription_id" TEXT,
    "stripe_invoice_id" TEXT,
    "metadata" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "club_subscription_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "lgems_balance" INTEGER NOT NULL DEFAULT 0,
    "diamonds_balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_transactions" (
    "id" TEXT NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "amount_float" DOUBLE PRECISION,
    "currency" TEXT NOT NULL,
    "reference_id" TEXT,
    "reference_type" TEXT,
    "balance_before" INTEGER NOT NULL,
    "balance_after" INTEGER NOT NULL,
    "stripe_payment_intent_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lgems_packs" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "lgems_amount" INTEGER NOT NULL,
    "bonus_lgems" INTEGER NOT NULL DEFAULT 0,
    "price_eur" DOUBLE PRECISION NOT NULL,
    "price_xof" DOUBLE PRECISION NOT NULL,
    "stripe_price_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lgems_packs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "virtual_gifts" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "description" TEXT,
    "animation_url" TEXT,
    "lgems_value" INTEGER NOT NULL,
    "is_impact_gift" BOOLEAN NOT NULL DEFAULT false,
    "impact_percent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "impact_cause_id" TEXT,
    "category" TEXT NOT NULL DEFAULT 'standard',
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "virtual_gifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "impact_causes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "logo_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "impact_causes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sent_gifts" (
    "id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "receiver_id" TEXT NOT NULL,
    "gift_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "lgems_amount" INTEGER NOT NULL,
    "diamonds_awarded" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "live_id" TEXT,
    "post_id" TEXT,
    "impact_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sent_gifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "impact_logs" (
    "id" TEXT NOT NULL,
    "cause_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "impact_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lives" (
    "id" TEXT NOT NULL,
    "host_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "thumbnail_url" TEXT,
    "type" TEXT NOT NULL DEFAULT 'live',
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "livekit_room_name" TEXT,
    "is_free" BOOLEAN NOT NULL DEFAULT true,
    "ticket_price_lgems" INTEGER NOT NULL DEFAULT 0,
    "free_minutes" INTEGER NOT NULL DEFAULT 0,
    "honor_seat_enabled" BOOLEAN NOT NULL DEFAULT false,
    "honor_seat_price" INTEGER NOT NULL DEFAULT 0,
    "honor_seat_duration" INTEGER NOT NULL DEFAULT 120,
    "peak_viewers" INTEGER NOT NULL DEFAULT 0,
    "total_gifts_lgems" INTEGER NOT NULL DEFAULT 0,
    "total_tickets_sold" INTEGER NOT NULL DEFAULT 0,
    "scheduled_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "ended_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "live_viewers" (
    "id" TEXT NOT NULL,
    "live_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'viewer',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" TIMESTAMP(3),
    "watch_duration_seconds" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "live_viewers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "live_tickets" (
    "id" TEXT NOT NULL,
    "live_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "lgems_paid" INTEGER NOT NULL,
    "purchased_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "live_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "badges" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "description" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "criteria_description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_badges" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "badge_id" TEXT NOT NULL,
    "earned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lia_conversations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lia_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lia_messages" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lia_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creator_scores" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "impact_score" INTEGER NOT NULL DEFAULT 0,
    "report_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "match_success_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "response_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_lgems_earned" INTEGER NOT NULL DEFAULT 0,
    "total_diamonds_earned" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_impact_generated" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bonus_eligible" BOOLEAN NOT NULL DEFAULT false,
    "last_bonus_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creator_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_categories" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "post_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_tag_relations" (
    "post_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,

    CONSTRAINT "post_tag_relations_pkey" PRIMARY KEY ("post_id","tag_id")
);

-- CreateTable
CREATE TABLE "user_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "target_id" TEXT,
    "target_type" TEXT,
    "category_code" TEXT,
    "duration_seconds" INTEGER,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_content_affinities" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "category_code" TEXT NOT NULL,
    "affinity_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "reaction_count" INTEGER NOT NULL DEFAULT 0,
    "comment_count" INTEGER NOT NULL DEFAULT 0,
    "profile_view_count" INTEGER NOT NULL DEFAULT 0,
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_content_affinities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matching_cursors" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "last_processed_user_id" TEXT,
    "total_processed" INTEGER NOT NULL DEFAULT 0,
    "full_cycle_completed" BOOLEAN NOT NULL DEFAULT false,
    "last_run_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "matching_cursors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prestige_invite_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "prospect_email" TEXT NOT NULL,
    "prospect_name" TEXT NOT NULL,
    "admin_note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "generated_by_id" TEXT NOT NULL,
    "used_by_id" TEXT,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prestige_invite_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_supabase_id_key" ON "users"("supabase_id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_name_key" ON "permissions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "actions_method_endpoint_key" ON "actions"("method", "endpoint");

-- CreateIndex
CREATE UNIQUE INDEX "menus_name_key" ON "menus"("name");

-- CreateIndex
CREATE UNIQUE INDEX "menus_path_key" ON "menus"("path");

-- CreateIndex
CREATE INDEX "conversations_created_by_id_idx" ON "conversations"("created_by_id");

-- CreateIndex
CREATE INDEX "conversations_type_idx" ON "conversations"("type");

-- CreateIndex
CREATE INDEX "conversations_updated_at_idx" ON "conversations"("updated_at");

-- CreateIndex
CREATE INDEX "conversation_participants_conversation_id_idx" ON "conversation_participants"("conversation_id");

-- CreateIndex
CREATE INDEX "conversation_participants_user_id_idx" ON "conversation_participants"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_participants_conversation_id_user_id_key" ON "conversation_participants"("conversation_id", "user_id");

-- CreateIndex
CREATE INDEX "messages_conversation_id_created_at_idx" ON "messages"("conversation_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "messages_sender_id_idx" ON "messages"("sender_id");

-- CreateIndex
CREATE INDEX "message_media_message_id_idx" ON "message_media"("message_id");

-- CreateIndex
CREATE INDEX "message_reactions_message_id_idx" ON "message_reactions"("message_id");

-- CreateIndex
CREATE INDEX "message_reactions_user_id_idx" ON "message_reactions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "message_reactions_message_id_user_id_emoji_key" ON "message_reactions"("message_id", "user_id", "emoji");

-- CreateIndex
CREATE INDEX "message_read_receipts_message_id_idx" ON "message_read_receipts"("message_id");

-- CreateIndex
CREATE UNIQUE INDEX "message_read_receipts_message_id_user_id_key" ON "message_read_receipts"("message_id", "user_id");

-- CreateIndex
CREATE INDEX "friendships_initiator_id_idx" ON "friendships"("initiator_id");

-- CreateIndex
CREATE INDEX "friendships_receiver_id_idx" ON "friendships"("receiver_id");

-- CreateIndex
CREATE INDEX "friendships_status_idx" ON "friendships"("status");

-- CreateIndex
CREATE UNIQUE INDEX "friendships_initiator_id_receiver_id_key" ON "friendships"("initiator_id", "receiver_id");

-- CreateIndex
CREATE INDEX "posts_author_id_idx" ON "posts"("author_id");

-- CreateIndex
CREATE INDEX "posts_visibility_idx" ON "posts"("visibility");

-- CreateIndex
CREATE INDEX "posts_category_id_idx" ON "posts"("category_id");

-- CreateIndex
CREATE INDEX "posts_created_at_idx" ON "posts"("created_at");

-- CreateIndex
CREATE INDEX "post_views_post_id_idx" ON "post_views"("post_id");

-- CreateIndex
CREATE INDEX "post_views_viewer_id_idx" ON "post_views"("viewer_id");

-- CreateIndex
CREATE INDEX "post_views_created_at_idx" ON "post_views"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "post_views_post_id_viewer_id_key" ON "post_views"("post_id", "viewer_id");

-- CreateIndex
CREATE INDEX "post_media_post_id_idx" ON "post_media"("post_id");

-- CreateIndex
CREATE INDEX "post_media_type_idx" ON "post_media"("type");

-- CreateIndex
CREATE UNIQUE INDEX "reaction_types_code_key" ON "reaction_types"("code");

-- CreateIndex
CREATE INDEX "reactions_user_id_idx" ON "reactions"("user_id");

-- CreateIndex
CREATE INDEX "reactions_post_id_idx" ON "reactions"("post_id");

-- CreateIndex
CREATE INDEX "reactions_comment_id_idx" ON "reactions"("comment_id");

-- CreateIndex
CREATE INDEX "reactions_type_id_idx" ON "reactions"("type_id");

-- CreateIndex
CREATE UNIQUE INDEX "reactions_user_id_post_id_type_id_key" ON "reactions"("user_id", "post_id", "type_id");

-- CreateIndex
CREATE UNIQUE INDEX "reactions_user_id_comment_id_type_id_key" ON "reactions"("user_id", "comment_id", "type_id");

-- CreateIndex
CREATE INDEX "comments_author_id_idx" ON "comments"("author_id");

-- CreateIndex
CREATE INDEX "comments_post_id_idx" ON "comments"("post_id");

-- CreateIndex
CREATE INDEX "comments_parent_id_idx" ON "comments"("parent_id");

-- CreateIndex
CREATE INDEX "comments_created_at_idx" ON "comments"("created_at");

-- CreateIndex
CREATE INDEX "stories_user_id_expires_at_idx" ON "stories"("user_id", "expires_at");

-- CreateIndex
CREATE INDEX "stories_is_expired_expires_at_idx" ON "stories"("is_expired", "expires_at");

-- CreateIndex
CREATE INDEX "story_slides_story_id_order_idx" ON "story_slides"("story_id", "order");

-- CreateIndex
CREATE INDEX "story_views_story_id_idx" ON "story_views"("story_id");

-- CreateIndex
CREATE INDEX "story_views_viewer_id_idx" ON "story_views"("viewer_id");

-- CreateIndex
CREATE UNIQUE INDEX "story_views_story_id_viewer_id_key" ON "story_views"("story_id", "viewer_id");

-- CreateIndex
CREATE INDEX "story_reactions_story_id_idx" ON "story_reactions"("story_id");

-- CreateIndex
CREATE INDEX "story_reactions_user_id_idx" ON "story_reactions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "story_reactions_story_id_user_id_key" ON "story_reactions"("story_id", "user_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_is_read_idx" ON "notifications"("is_read");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "notifications"("type");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "preferences_user_id_key" ON "preferences"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "preference_genders_preference_id_gender_code_key" ON "preference_genders"("preference_id", "gender_code");

-- CreateIndex
CREATE UNIQUE INDEX "preference_skin_tones_preference_id_skin_tone_id_key" ON "preference_skin_tones"("preference_id", "skin_tone_id");

-- CreateIndex
CREATE UNIQUE INDEX "preference_relationship_statuses_preference_id_relationship_key" ON "preference_relationship_statuses"("preference_id", "relationship_status_id");

-- CreateIndex
CREATE UNIQUE INDEX "preference_sexual_orientations_preference_id_sexual_orienta_key" ON "preference_sexual_orientations"("preference_id", "sexual_orientation_id");

-- CreateIndex
CREATE UNIQUE INDEX "preference_education_levels_preference_id_education_level_i_key" ON "preference_education_levels"("preference_id", "education_level_id");

-- CreateIndex
CREATE UNIQUE INDEX "preference_personality_types_preference_id_personality_type_key" ON "preference_personality_types"("preference_id", "personality_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "preference_zodiac_signs_preference_id_zodiac_sign_id_key" ON "preference_zodiac_signs"("preference_id", "zodiac_sign_id");

-- CreateIndex
CREATE UNIQUE INDEX "preference_religions_preference_id_religion_id_key" ON "preference_religions"("preference_id", "religion_id");

-- CreateIndex
CREATE UNIQUE INDEX "preference_residence_countries_preference_id_country_code_key" ON "preference_residence_countries"("preference_id", "country_code");

-- CreateIndex
CREATE UNIQUE INDEX "preference_interests_preference_id_interest_id_key" ON "preference_interests"("preference_id", "interest_id");

-- CreateIndex
CREATE UNIQUE INDEX "preference_nationalities_preference_id_country_code_key" ON "preference_nationalities"("preference_id", "country_code");

-- CreateIndex
CREATE UNIQUE INDEX "preference_cities_preference_id_city_id_key" ON "preference_cities"("preference_id", "city_id");

-- CreateIndex
CREATE UNIQUE INDEX "profils_user_id_key" ON "profils"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "company_profiles_user_id_key" ON "company_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "interest_categories_name_key" ON "interest_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "interests_name_category_id_key" ON "interests"("name", "category_id");

-- CreateIndex
CREATE UNIQUE INDEX "religions_code_key" ON "religions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "zodiac_signs_code_key" ON "zodiac_signs"("code");

-- CreateIndex
CREATE UNIQUE INDEX "sexual_orientations_code_key" ON "sexual_orientations"("code");

-- CreateIndex
CREATE UNIQUE INDEX "relationship_statuses_code_key" ON "relationship_statuses"("code");

-- CreateIndex
CREATE UNIQUE INDEX "skin_tones_code_key" ON "skin_tones"("code");

-- CreateIndex
CREATE UNIQUE INDEX "personality_types_code_key" ON "personality_types"("code");

-- CreateIndex
CREATE UNIQUE INDEX "education_levels_code_key" ON "education_levels"("code");

-- CreateIndex
CREATE UNIQUE INDEX "profil_interests_profil_id_interest_id_key" ON "profil_interests"("profil_id", "interest_id");

-- CreateIndex
CREATE UNIQUE INDEX "nationalities_code_key" ON "nationalities"("code");

-- CreateIndex
CREATE UNIQUE INDEX "profil_nationalities_profil_id_nationality_id_key" ON "profil_nationalities"("profil_id", "nationality_id");

-- CreateIndex
CREATE INDEX "cities_country_code_idx" ON "cities"("country_code");

-- CreateIndex
CREATE INDEX "cities_state_code_idx" ON "cities"("state_code");

-- CreateIndex
CREATE UNIQUE INDEX "cities_name_state_code_country_code_key" ON "cities"("name", "state_code", "country_code");

-- CreateIndex
CREATE UNIQUE INDEX "currencies_code_key" ON "currencies"("code");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_types_code_key" ON "subscription_types"("code");

-- CreateIndex
CREATE UNIQUE INDEX "user_subscriptions_user_id_key" ON "user_subscriptions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_subscriptions_stripe_subscription_id_key" ON "user_subscriptions"("stripe_subscription_id");

-- CreateIndex
CREATE INDEX "user_subscriptions_user_id_idx" ON "user_subscriptions"("user_id");

-- CreateIndex
CREATE INDEX "user_subscriptions_status_idx" ON "user_subscriptions"("status");

-- CreateIndex
CREATE INDEX "subscription_history_user_id_idx" ON "subscription_history"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "stripe_customers_user_id_key" ON "stripe_customers"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "stripe_customers_stripe_customer_id_key" ON "stripe_customers"("stripe_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "stripe_payment_methods_stripe_payment_method_id_key" ON "stripe_payment_methods"("stripe_payment_method_id");

-- CreateIndex
CREATE UNIQUE INDEX "stripe_invoices_stripe_invoice_id_key" ON "stripe_invoices"("stripe_invoice_id");

-- CreateIndex
CREATE INDEX "stripe_invoices_stripe_customer_id_idx" ON "stripe_invoices"("stripe_customer_id");

-- CreateIndex
CREATE INDEX "match_scores_user_id_score_idx" ON "match_scores"("user_id", "score");

-- CreateIndex
CREATE INDEX "match_scores_target_user_id_idx" ON "match_scores"("target_user_id");

-- CreateIndex
CREATE INDEX "match_scores_score_idx" ON "match_scores"("score");

-- CreateIndex
CREATE INDEX "match_scores_last_calculated_idx" ON "match_scores"("last_calculated");

-- CreateIndex
CREATE UNIQUE INDEX "match_scores_user_id_target_user_id_key" ON "match_scores"("user_id", "target_user_id");

-- CreateIndex
CREATE INDEX "profile_likes_user_id_idx" ON "profile_likes"("user_id");

-- CreateIndex
CREATE INDEX "profile_likes_profile_id_idx" ON "profile_likes"("profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "profile_likes_user_id_profile_id_key" ON "profile_likes"("user_id", "profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "report_categories_code_key" ON "report_categories"("code");

-- CreateIndex
CREATE INDEX "reports_reporter_id_idx" ON "reports"("reporter_id");

-- CreateIndex
CREATE INDEX "reports_reported_user_id_idx" ON "reports"("reported_user_id");

-- CreateIndex
CREATE INDEX "reports_status_idx" ON "reports"("status");

-- CreateIndex
CREATE INDEX "reports_category_id_idx" ON "reports"("category_id");

-- CreateIndex
CREATE INDEX "reviews_reviewer_id_idx" ON "reviews"("reviewer_id");

-- CreateIndex
CREATE INDEX "reviews_reviewed_user_id_idx" ON "reviews"("reviewed_user_id");

-- CreateIndex
CREATE INDEX "reviews_rating_idx" ON "reviews"("rating");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_reviewer_id_reviewed_user_id_key" ON "reviews"("reviewer_id", "reviewed_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "club_subscriptions_user_id_key" ON "club_subscriptions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "club_subscriptions_stripe_subscription_id_key" ON "club_subscriptions"("stripe_subscription_id");

-- CreateIndex
CREATE INDEX "club_subscriptions_user_id_idx" ON "club_subscriptions"("user_id");

-- CreateIndex
CREATE INDEX "club_subscriptions_status_idx" ON "club_subscriptions"("status");

-- CreateIndex
CREATE INDEX "club_subscriptions_stripe_subscription_id_idx" ON "club_subscriptions"("stripe_subscription_id");

-- CreateIndex
CREATE INDEX "club_subscription_history_user_id_idx" ON "club_subscription_history"("user_id");

-- CreateIndex
CREATE INDEX "club_subscription_history_action_idx" ON "club_subscription_history"("action");

-- CreateIndex
CREATE INDEX "club_subscription_history_created_at_idx" ON "club_subscription_history"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_user_id_key" ON "wallets"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_transactions_stripe_payment_intent_id_key" ON "wallet_transactions"("stripe_payment_intent_id");

-- CreateIndex
CREATE INDEX "wallet_transactions_wallet_id_idx" ON "wallet_transactions"("wallet_id");

-- CreateIndex
CREATE INDEX "wallet_transactions_type_idx" ON "wallet_transactions"("type");

-- CreateIndex
CREATE INDEX "wallet_transactions_created_at_idx" ON "wallet_transactions"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "lgems_packs_code_key" ON "lgems_packs"("code");

-- CreateIndex
CREATE UNIQUE INDEX "virtual_gifts_code_key" ON "virtual_gifts"("code");

-- CreateIndex
CREATE INDEX "sent_gifts_sender_id_idx" ON "sent_gifts"("sender_id");

-- CreateIndex
CREATE INDEX "sent_gifts_receiver_id_idx" ON "sent_gifts"("receiver_id");

-- CreateIndex
CREATE INDEX "sent_gifts_live_id_idx" ON "sent_gifts"("live_id");

-- CreateIndex
CREATE INDEX "sent_gifts_post_id_idx" ON "sent_gifts"("post_id");

-- CreateIndex
CREATE INDEX "sent_gifts_created_at_idx" ON "sent_gifts"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "impact_logs_cause_id_period_key" ON "impact_logs"("cause_id", "period");

-- CreateIndex
CREATE UNIQUE INDEX "lives_livekit_room_name_key" ON "lives"("livekit_room_name");

-- CreateIndex
CREATE INDEX "lives_host_id_idx" ON "lives"("host_id");

-- CreateIndex
CREATE INDEX "lives_status_idx" ON "lives"("status");

-- CreateIndex
CREATE INDEX "lives_scheduled_at_idx" ON "lives"("scheduled_at");

-- CreateIndex
CREATE INDEX "live_viewers_live_id_idx" ON "live_viewers"("live_id");

-- CreateIndex
CREATE UNIQUE INDEX "live_viewers_live_id_user_id_key" ON "live_viewers"("live_id", "user_id");

-- CreateIndex
CREATE INDEX "live_tickets_live_id_idx" ON "live_tickets"("live_id");

-- CreateIndex
CREATE UNIQUE INDEX "live_tickets_live_id_user_id_key" ON "live_tickets"("live_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "badges_code_key" ON "badges"("code");

-- CreateIndex
CREATE INDEX "user_badges_user_id_idx" ON "user_badges"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_badges_user_id_badge_id_key" ON "user_badges"("user_id", "badge_id");

-- CreateIndex
CREATE UNIQUE INDEX "lia_conversations_user_id_key" ON "lia_conversations"("user_id");

-- CreateIndex
CREATE INDEX "lia_messages_conversation_id_created_at_idx" ON "lia_messages"("conversation_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "creator_scores_user_id_key" ON "creator_scores"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "post_categories_code_key" ON "post_categories"("code");

-- CreateIndex
CREATE UNIQUE INDEX "post_tags_name_key" ON "post_tags"("name");

-- CreateIndex
CREATE INDEX "post_tag_relations_tag_id_idx" ON "post_tag_relations"("tag_id");

-- CreateIndex
CREATE INDEX "user_events_user_id_event_type_idx" ON "user_events"("user_id", "event_type");

-- CreateIndex
CREATE INDEX "user_events_user_id_category_code_idx" ON "user_events"("user_id", "category_code");

-- CreateIndex
CREATE INDEX "user_events_user_id_created_at_idx" ON "user_events"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "user_events_created_at_idx" ON "user_events"("created_at");

-- CreateIndex
CREATE INDEX "user_content_affinities_user_id_affinity_score_idx" ON "user_content_affinities"("user_id", "affinity_score" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "user_content_affinities_user_id_category_code_key" ON "user_content_affinities"("user_id", "category_code");

-- CreateIndex
CREATE UNIQUE INDEX "matching_cursors_user_id_key" ON "matching_cursors"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "prestige_invite_codes_code_key" ON "prestige_invite_codes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "prestige_invite_codes_used_by_id_key" ON "prestige_invite_codes"("used_by_id");

-- CreateIndex
CREATE INDEX "prestige_invite_codes_status_idx" ON "prestige_invite_codes"("status");

-- CreateIndex
CREATE INDEX "prestige_invite_codes_prospect_email_idx" ON "prestige_invite_codes"("prospect_email");

-- CreateIndex
CREATE INDEX "prestige_invite_codes_expires_at_idx" ON "prestige_invite_codes"("expires_at");

-- CreateIndex
CREATE INDEX "prestige_invite_codes_generated_by_id_idx" ON "prestige_invite_codes"("generated_by_id");

-- AddForeignKey
ALTER TABLE "menus" ADD CONSTRAINT "menus_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "menus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permission_actions" ADD CONSTRAINT "permission_actions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permission_actions" ADD CONSTRAINT "permission_actions_action_id_fkey" FOREIGN KEY ("action_id") REFERENCES "actions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_permissions" ADD CONSTRAINT "menu_permissions_menu_id_fkey" FOREIGN KEY ("menu_id") REFERENCES "menus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_permissions" ADD CONSTRAINT "menu_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_reply_to_id_fkey" FOREIGN KEY ("reply_to_id") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_media" ADD CONSTRAINT "message_media_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_reactions" ADD CONSTRAINT "message_reactions_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_reactions" ADD CONSTRAINT "message_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_read_receipts" ADD CONSTRAINT "message_read_receipts_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_read_receipts" ADD CONSTRAINT "message_read_receipts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_initiator_id_fkey" FOREIGN KEY ("initiator_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "post_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_views" ADD CONSTRAINT "post_views_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_views" ADD CONSTRAINT "post_views_viewer_id_fkey" FOREIGN KEY ("viewer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_media" ADD CONSTRAINT "post_media_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "reaction_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stories" ADD CONSTRAINT "stories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_slides" ADD CONSTRAINT "story_slides_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_views" ADD CONSTRAINT "story_views_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_views" ADD CONSTRAINT "story_views_viewer_id_fkey" FOREIGN KEY ("viewer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_reactions" ADD CONSTRAINT "story_reactions_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_reactions" ADD CONSTRAINT "story_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preferences" ADD CONSTRAINT "preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preference_genders" ADD CONSTRAINT "preference_genders_preference_id_fkey" FOREIGN KEY ("preference_id") REFERENCES "preferences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preference_skin_tones" ADD CONSTRAINT "preference_skin_tones_preference_id_fkey" FOREIGN KEY ("preference_id") REFERENCES "preferences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preference_skin_tones" ADD CONSTRAINT "preference_skin_tones_skin_tone_id_fkey" FOREIGN KEY ("skin_tone_id") REFERENCES "skin_tones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preference_relationship_statuses" ADD CONSTRAINT "preference_relationship_statuses_preference_id_fkey" FOREIGN KEY ("preference_id") REFERENCES "preferences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preference_relationship_statuses" ADD CONSTRAINT "preference_relationship_statuses_relationship_status_id_fkey" FOREIGN KEY ("relationship_status_id") REFERENCES "relationship_statuses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preference_sexual_orientations" ADD CONSTRAINT "preference_sexual_orientations_preference_id_fkey" FOREIGN KEY ("preference_id") REFERENCES "preferences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preference_sexual_orientations" ADD CONSTRAINT "preference_sexual_orientations_sexual_orientation_id_fkey" FOREIGN KEY ("sexual_orientation_id") REFERENCES "sexual_orientations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preference_education_levels" ADD CONSTRAINT "preference_education_levels_preference_id_fkey" FOREIGN KEY ("preference_id") REFERENCES "preferences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preference_education_levels" ADD CONSTRAINT "preference_education_levels_education_level_id_fkey" FOREIGN KEY ("education_level_id") REFERENCES "education_levels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preference_personality_types" ADD CONSTRAINT "preference_personality_types_preference_id_fkey" FOREIGN KEY ("preference_id") REFERENCES "preferences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preference_personality_types" ADD CONSTRAINT "preference_personality_types_personality_type_id_fkey" FOREIGN KEY ("personality_type_id") REFERENCES "personality_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preference_zodiac_signs" ADD CONSTRAINT "preference_zodiac_signs_preference_id_fkey" FOREIGN KEY ("preference_id") REFERENCES "preferences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preference_zodiac_signs" ADD CONSTRAINT "preference_zodiac_signs_zodiac_sign_id_fkey" FOREIGN KEY ("zodiac_sign_id") REFERENCES "zodiac_signs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preference_religions" ADD CONSTRAINT "preference_religions_preference_id_fkey" FOREIGN KEY ("preference_id") REFERENCES "preferences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preference_religions" ADD CONSTRAINT "preference_religions_religion_id_fkey" FOREIGN KEY ("religion_id") REFERENCES "religions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preference_residence_countries" ADD CONSTRAINT "preference_residence_countries_preference_id_fkey" FOREIGN KEY ("preference_id") REFERENCES "preferences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preference_residence_countries" ADD CONSTRAINT "preference_residence_countries_country_code_fkey" FOREIGN KEY ("country_code") REFERENCES "nationalities"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preference_interests" ADD CONSTRAINT "preference_interests_preference_id_fkey" FOREIGN KEY ("preference_id") REFERENCES "preferences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preference_interests" ADD CONSTRAINT "preference_interests_interest_id_fkey" FOREIGN KEY ("interest_id") REFERENCES "interests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preference_nationalities" ADD CONSTRAINT "preference_nationalities_preference_id_fkey" FOREIGN KEY ("preference_id") REFERENCES "preferences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preference_nationalities" ADD CONSTRAINT "preference_nationalities_country_code_fkey" FOREIGN KEY ("country_code") REFERENCES "nationalities"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preference_cities" ADD CONSTRAINT "preference_cities_preference_id_fkey" FOREIGN KEY ("preference_id") REFERENCES "preferences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preference_cities" ADD CONSTRAINT "preference_cities_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profils" ADD CONSTRAINT "profils_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profils" ADD CONSTRAINT "profils_country_origin_code_fkey" FOREIGN KEY ("country_origin_code") REFERENCES "nationalities"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profils" ADD CONSTRAINT "profils_country_residence_code_fkey" FOREIGN KEY ("country_residence_code") REFERENCES "nationalities"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profils" ADD CONSTRAINT "profils_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_profiles" ADD CONSTRAINT "company_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interests" ADD CONSTRAINT "interests_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "interest_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profil_interests" ADD CONSTRAINT "profil_interests_profil_id_fkey" FOREIGN KEY ("profil_id") REFERENCES "profils"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profil_interests" ADD CONSTRAINT "profil_interests_interest_id_fkey" FOREIGN KEY ("interest_id") REFERENCES "interests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profil_nationalities" ADD CONSTRAINT "profil_nationalities_profil_id_fkey" FOREIGN KEY ("profil_id") REFERENCES "profils"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profil_nationalities" ADD CONSTRAINT "profil_nationalities_nationality_id_fkey" FOREIGN KEY ("nationality_id") REFERENCES "nationalities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_types" ADD CONSTRAINT "subscription_types_currency_id_fkey" FOREIGN KEY ("currency_id") REFERENCES "currencies"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_features" ADD CONSTRAINT "subscription_features_subscription_type_id_fkey" FOREIGN KEY ("subscription_type_id") REFERENCES "subscription_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_subscription_type_id_fkey" FOREIGN KEY ("subscription_type_id") REFERENCES "subscription_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_history" ADD CONSTRAINT "subscription_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_history" ADD CONSTRAINT "subscription_history_subscription_type_id_fkey" FOREIGN KEY ("subscription_type_id") REFERENCES "subscription_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stripe_customers" ADD CONSTRAINT "stripe_customers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stripe_payment_methods" ADD CONSTRAINT "stripe_payment_methods_stripe_customer_id_fkey" FOREIGN KEY ("stripe_customer_id") REFERENCES "stripe_customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stripe_invoices" ADD CONSTRAINT "stripe_invoices_stripe_customer_id_fkey" FOREIGN KEY ("stripe_customer_id") REFERENCES "stripe_customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stripe_invoices" ADD CONSTRAINT "stripe_invoices_currency_id_fkey" FOREIGN KEY ("currency_id") REFERENCES "currencies"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_scores" ADD CONSTRAINT "match_scores_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_scores" ADD CONSTRAINT "match_scores_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_likes" ADD CONSTRAINT "profile_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_likes" ADD CONSTRAINT "profile_likes_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reported_user_id_fkey" FOREIGN KEY ("reported_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "report_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewed_user_id_fkey" FOREIGN KEY ("reviewed_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_subscriptions" ADD CONSTRAINT "club_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_subscription_history" ADD CONSTRAINT "club_subscription_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "virtual_gifts" ADD CONSTRAINT "virtual_gifts_impact_cause_id_fkey" FOREIGN KEY ("impact_cause_id") REFERENCES "impact_causes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sent_gifts" ADD CONSTRAINT "sent_gifts_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sent_gifts" ADD CONSTRAINT "sent_gifts_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sent_gifts" ADD CONSTRAINT "sent_gifts_gift_id_fkey" FOREIGN KEY ("gift_id") REFERENCES "virtual_gifts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sent_gifts" ADD CONSTRAINT "sent_gifts_live_id_fkey" FOREIGN KEY ("live_id") REFERENCES "lives"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "impact_logs" ADD CONSTRAINT "impact_logs_cause_id_fkey" FOREIGN KEY ("cause_id") REFERENCES "impact_causes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lives" ADD CONSTRAINT "lives_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_viewers" ADD CONSTRAINT "live_viewers_live_id_fkey" FOREIGN KEY ("live_id") REFERENCES "lives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_viewers" ADD CONSTRAINT "live_viewers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_tickets" ADD CONSTRAINT "live_tickets_live_id_fkey" FOREIGN KEY ("live_id") REFERENCES "lives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_tickets" ADD CONSTRAINT "live_tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_badge_id_fkey" FOREIGN KEY ("badge_id") REFERENCES "badges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lia_conversations" ADD CONSTRAINT "lia_conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lia_messages" ADD CONSTRAINT "lia_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "lia_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_scores" ADD CONSTRAINT "creator_scores_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_tag_relations" ADD CONSTRAINT "post_tag_relations_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_tag_relations" ADD CONSTRAINT "post_tag_relations_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "post_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_events" ADD CONSTRAINT "user_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_content_affinities" ADD CONSTRAINT "user_content_affinities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matching_cursors" ADD CONSTRAINT "matching_cursors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prestige_invite_codes" ADD CONSTRAINT "prestige_invite_codes_generated_by_id_fkey" FOREIGN KEY ("generated_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prestige_invite_codes" ADD CONSTRAINT "prestige_invite_codes_used_by_id_fkey" FOREIGN KEY ("used_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
