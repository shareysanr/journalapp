-- CreateTable
CREATE TABLE "recurring_goals" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recurring_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goal_completions" (
    "id" SERIAL NOT NULL,
    "goal_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "goal_completions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "recurring_goals_user_id_idx" ON "recurring_goals"("user_id");

-- CreateIndex
CREATE INDEX "goal_completions_user_id_date_idx" ON "goal_completions"("user_id", "date");

-- CreateIndex
CREATE INDEX "goal_completions_goal_id_date_idx" ON "goal_completions"("goal_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "goal_completions_goal_id_date_key" ON "goal_completions"("goal_id", "date");

-- AddForeignKey
ALTER TABLE "recurring_goals" ADD CONSTRAINT "recurring_goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_completions" ADD CONSTRAINT "goal_completions_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "recurring_goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_completions" ADD CONSTRAINT "goal_completions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
