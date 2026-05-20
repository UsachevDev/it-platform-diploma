-- CreateTable
CREATE TABLE "Skill" (
    "id" UUID NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Skill_name_key" ON "Skill"("name");

-- CreateTable
CREATE TABLE "UserSkill" (
    "userId" UUID NOT NULL,
    "skillId" UUID NOT NULL,

    CONSTRAINT "UserSkill_pkey" PRIMARY KEY ("userId","skillId")
);

-- CreateIndex
CREATE INDEX "UserSkill_skillId_idx" ON "UserSkill"("skillId");

-- AddForeignKey
ALTER TABLE "UserSkill" ADD CONSTRAINT "UserSkill_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSkill" ADD CONSTRAINT "UserSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed: справочник навыков
INSERT INTO "Skill" ("id", "name") VALUES
  (gen_random_uuid(), 'JavaScript'),
  (gen_random_uuid(), 'TypeScript'),
  (gen_random_uuid(), 'React'),
  (gen_random_uuid(), 'Next.js'),
  (gen_random_uuid(), 'Vue'),
  (gen_random_uuid(), 'Angular'),
  (gen_random_uuid(), 'Node.js'),
  (gen_random_uuid(), 'NestJS'),
  (gen_random_uuid(), 'Express'),
  (gen_random_uuid(), 'Python'),
  (gen_random_uuid(), 'Django'),
  (gen_random_uuid(), 'FastAPI'),
  (gen_random_uuid(), 'Go'),
  (gen_random_uuid(), 'Java'),
  (gen_random_uuid(), 'Spring Boot'),
  (gen_random_uuid(), 'C#'),
  (gen_random_uuid(), '.NET'),
  (gen_random_uuid(), 'PHP'),
  (gen_random_uuid(), 'Laravel'),
  (gen_random_uuid(), 'React Native'),
  (gen_random_uuid(), 'Flutter'),
  (gen_random_uuid(), 'Swift'),
  (gen_random_uuid(), 'PostgreSQL'),
  (gen_random_uuid(), 'MySQL'),
  (gen_random_uuid(), 'MongoDB'),
  (gen_random_uuid(), 'Redis'),
  (gen_random_uuid(), 'Prisma'),
  (gen_random_uuid(), 'GraphQL'),
  (gen_random_uuid(), 'REST API'),
  (gen_random_uuid(), 'Docker'),
  (gen_random_uuid(), 'Kubernetes'),
  (gen_random_uuid(), 'AWS'),
  (gen_random_uuid(), 'Linux'),
  (gen_random_uuid(), 'CI/CD'),
  (gen_random_uuid(), 'Jest'),
  (gen_random_uuid(), 'Playwright'),
  (gen_random_uuid(), 'Cypress'),
  (gen_random_uuid(), 'Figma'),
  (gen_random_uuid(), 'UI/UX'),
  (gen_random_uuid(), 'SQL')
ON CONFLICT ("name") DO NOTHING;

-- Перенос существующих навыков пользователей в справочник
INSERT INTO "Skill" ("id", "name")
SELECT gen_random_uuid(), s
FROM (SELECT DISTINCT unnest("skills") AS s FROM "User") AS distinct_skills
WHERE s IS NOT NULL AND s <> ''
ON CONFLICT ("name") DO NOTHING;

-- Создание связей пользователь-навык из старого массива
INSERT INTO "UserSkill" ("userId", "skillId")
SELECT u."id", sk."id"
FROM "User" u
CROSS JOIN LATERAL unnest(u."skills") AS us(name)
JOIN "Skill" sk ON sk."name" = us.name
ON CONFLICT DO NOTHING;

-- DropColumn
ALTER TABLE "User" DROP COLUMN "skills";
