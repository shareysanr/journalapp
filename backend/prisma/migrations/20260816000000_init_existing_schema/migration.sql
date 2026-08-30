-- Baseline schema for tables originally created via `db push` before Prisma migrations.
-- `mood` and `motivation` are added in the next migration.

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "cognito_sub" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entries" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "goals_planned" TEXT NOT NULL,
    "num_goals" INTEGER NOT NULL,
    "goals_completed" INTEGER NOT NULL,
    "distractions" TEXT[],
    "negative_components" TEXT[],
    "positive_components" TEXT[],
    "difficulty" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "notes" TEXT,

    CONSTRAINT "entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weekly_reports" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "week_start_date" DATE NOT NULL,
    "week_end_date" DATE NOT NULL,
    "summary" TEXT NOT NULL,
    "recommendations" TEXT NOT NULL,
    "accomplishments" INTEGER NOT NULL,
    "failures" INTEGER NOT NULL,
    "average_rating" DOUBLE PRECISION NOT NULL,
    "common_distractions" TEXT[],
    "common_negative_components" TEXT[],
    "common_positive_components" TEXT[],
    "entry_ids" INTEGER[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weekly_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_cognito_sub_key" ON "users"("cognito_sub");

-- CreateIndex
CREATE UNIQUE INDEX "weekly_reports_user_id_week_start_date_week_end_date_key" ON "weekly_reports"("user_id", "week_start_date", "week_end_date");

-- AddForeignKey
ALTER TABLE "entries" ADD CONSTRAINT "entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_reports" ADD CONSTRAINT "weekly_reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
