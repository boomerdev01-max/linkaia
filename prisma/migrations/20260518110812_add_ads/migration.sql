-- CreateTable
CREATE TABLE "ad_campaigns" (
    "id" TEXT NOT NULL,
    "advertiser_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "billing_model" TEXT NOT NULL,
    "cpm_rate" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "cpc_rate" DOUBLE PRECISION NOT NULL DEFAULT 0.1,
    "total_budget" DOUBLE PRECISION NOT NULL,
    "daily_budget_cap" DOUBLE PRECISION,
    "amount_spent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stripe_payment_intent_id" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'draft',
    "rejected_reason" TEXT,
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "total_impressions" INTEGER NOT NULL DEFAULT 0,
    "total_clicks" INTEGER NOT NULL DEFAULT 0,
    "ctr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ad_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_creatives" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "image_url" TEXT,
    "cta_label" TEXT NOT NULL,
    "cta_url" TEXT,
    "target_profile_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ad_creatives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_targetings" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "interest_codes" TEXT[],
    "country_codes" TEXT[],
    "age_min" INTEGER,
    "age_max" INTEGER,
    "genders" TEXT[],
    "education_level_codes" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ad_targetings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_impressions" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "viewer_id" TEXT NOT NULL,
    "cost_eur" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "feed_position" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ad_impressions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_clicks" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "clicker_id" TEXT NOT NULL,
    "cost_eur" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "destination" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ad_clicks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_credit_transactions" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount_eur" DOUBLE PRECISION NOT NULL,
    "balance_before" DOUBLE PRECISION NOT NULL,
    "balance_after" DOUBLE PRECISION NOT NULL,
    "stripe_payment_intent_id" TEXT,
    "reference_id" TEXT,
    "reference_type" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ad_credit_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ad_campaigns_stripe_payment_intent_id_key" ON "ad_campaigns"("stripe_payment_intent_id");

-- CreateIndex
CREATE INDEX "ad_campaigns_advertiser_id_idx" ON "ad_campaigns"("advertiser_id");

-- CreateIndex
CREATE INDEX "ad_campaigns_status_idx" ON "ad_campaigns"("status");

-- CreateIndex
CREATE INDEX "ad_campaigns_start_date_end_date_idx" ON "ad_campaigns"("start_date", "end_date");

-- CreateIndex
CREATE UNIQUE INDEX "ad_creatives_campaign_id_key" ON "ad_creatives"("campaign_id");

-- CreateIndex
CREATE UNIQUE INDEX "ad_targetings_campaign_id_key" ON "ad_targetings"("campaign_id");

-- CreateIndex
CREATE INDEX "ad_impressions_campaign_id_created_at_idx" ON "ad_impressions"("campaign_id", "created_at");

-- CreateIndex
CREATE INDEX "ad_impressions_viewer_id_idx" ON "ad_impressions"("viewer_id");

-- CreateIndex
CREATE INDEX "ad_impressions_created_at_idx" ON "ad_impressions"("created_at");

-- CreateIndex
CREATE INDEX "ad_clicks_campaign_id_idx" ON "ad_clicks"("campaign_id");

-- CreateIndex
CREATE INDEX "ad_clicks_clicker_id_idx" ON "ad_clicks"("clicker_id");

-- CreateIndex
CREATE INDEX "ad_clicks_created_at_idx" ON "ad_clicks"("created_at");

-- CreateIndex
CREATE INDEX "ad_credit_transactions_campaign_id_idx" ON "ad_credit_transactions"("campaign_id");

-- CreateIndex
CREATE INDEX "ad_credit_transactions_type_idx" ON "ad_credit_transactions"("type");

-- CreateIndex
CREATE INDEX "ad_credit_transactions_created_at_idx" ON "ad_credit_transactions"("created_at");

-- AddForeignKey
ALTER TABLE "ad_campaigns" ADD CONSTRAINT "ad_campaigns_advertiser_id_fkey" FOREIGN KEY ("advertiser_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_creatives" ADD CONSTRAINT "ad_creatives_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "ad_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_creatives" ADD CONSTRAINT "ad_creatives_target_profile_id_fkey" FOREIGN KEY ("target_profile_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_targetings" ADD CONSTRAINT "ad_targetings_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "ad_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_impressions" ADD CONSTRAINT "ad_impressions_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "ad_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_impressions" ADD CONSTRAINT "ad_impressions_viewer_id_fkey" FOREIGN KEY ("viewer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_clicks" ADD CONSTRAINT "ad_clicks_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "ad_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_clicks" ADD CONSTRAINT "ad_clicks_clicker_id_fkey" FOREIGN KEY ("clicker_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_credit_transactions" ADD CONSTRAINT "ad_credit_transactions_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "ad_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
