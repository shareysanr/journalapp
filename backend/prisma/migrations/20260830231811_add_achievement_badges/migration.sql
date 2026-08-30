-- CreateTable
CREATE TABLE "achievement_definitions" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "achievement_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "achievement_unlocks" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "achievement_definition_id" INTEGER NOT NULL,
    "unlocked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "achievement_unlocks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "achievement_definitions_key_key" ON "achievement_definitions"("key");

-- CreateIndex
CREATE INDEX "achievement_definitions_category_sort_order_idx" ON "achievement_definitions"("category", "sort_order");

-- CreateIndex
CREATE INDEX "achievement_unlocks_user_id_idx" ON "achievement_unlocks"("user_id");

-- CreateIndex
CREATE INDEX "achievement_unlocks_achievement_definition_id_idx" ON "achievement_unlocks"("achievement_definition_id");

-- CreateIndex
CREATE INDEX "achievement_unlocks_unlocked_at_idx" ON "achievement_unlocks"("unlocked_at");

-- CreateIndex
CREATE UNIQUE INDEX "achievement_unlocks_user_id_achievement_definition_id_key" ON "achievement_unlocks"("user_id", "achievement_definition_id");

-- AddForeignKey
ALTER TABLE "achievement_unlocks" ADD CONSTRAINT "achievement_unlocks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "achievement_unlocks" ADD CONSTRAINT "achievement_unlocks_achievement_definition_id_fkey" FOREIGN KEY ("achievement_definition_id") REFERENCES "achievement_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
