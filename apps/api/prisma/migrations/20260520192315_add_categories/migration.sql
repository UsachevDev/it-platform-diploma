-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "categoryId" UUID;

-- CreateTable
CREATE TABLE "Category" (
    "id" UUID NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "slug" VARCHAR(80) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "Project_categoryId_idx" ON "Project"("categoryId");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed: базовые категории проектов
INSERT INTO "Category" ("id", "name", "slug") VALUES
  (gen_random_uuid(), 'Веб-разработка', 'web'),
  (gen_random_uuid(), 'Мобильная разработка', 'mobile'),
  (gen_random_uuid(), 'Backend и API', 'backend'),
  (gen_random_uuid(), 'Дизайн и UI/UX', 'design'),
  (gen_random_uuid(), 'DevOps и инфраструктура', 'devops'),
  (gen_random_uuid(), 'Тестирование и QA', 'qa'),
  (gen_random_uuid(), 'Данные и аналитика', 'data'),
  (gen_random_uuid(), 'Другое', 'other');
