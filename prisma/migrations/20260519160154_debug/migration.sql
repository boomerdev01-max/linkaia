-- CreateTable
CREATE TABLE "boost_packs" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "duration_minutes" INTEGER NOT NULL,
    "lgems_price" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "boost_packs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_boosts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "pack_id" TEXT NOT NULL,
    "lgems_paid" INTEGER NOT NULL,
    "activated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_boosts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "boost_packs_code_key" ON "boost_packs"("code");

-- CreateIndex
CREATE INDEX "profile_boosts_user_id_status_idx" ON "profile_boosts"("user_id", "status");

-- CreateIndex
CREATE INDEX "profile_boosts_expires_at_idx" ON "profile_boosts"("expires_at");

-- CreateIndex
CREATE INDEX "profile_boosts_status_idx" ON "profile_boosts"("status");

-- AddForeignKey
ALTER TABLE "profile_boosts" ADD CONSTRAINT "profile_boosts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_boosts" ADD CONSTRAINT "profile_boosts_pack_id_fkey" FOREIGN KEY ("pack_id") REFERENCES "boost_packs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
