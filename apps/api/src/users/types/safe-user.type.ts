import { Prisma } from '@prisma/client';

export const safeUserSelect = {
  id: true,
  email: true,
  role: true,
  name: true,
  about: true,
  isBlocked: true,
  blockReason: true,
  blockedUntil: true,
  createdAt: true,
  updatedAt: true,
  userSkills: {
    select: {
      skill: {
        select: { name: true },
      },
    },
    orderBy: {
      skill: { name: 'asc' },
    },
  },
} as const satisfies Prisma.UserSelect;

export type SafeUser = Prisma.UserGetPayload<{
  select: typeof safeUserSelect;
}>;

type UserWithSkills = {
  userSkills: { skill: { name: string } }[];
};

/**
 * Превращает связь userSkills в плоский массив строк `skills`
 * для удобства фронтенда — внешний контракт API остаётся стабильным.
 */
export function toSafeUser<T extends UserWithSkills>(
  user: T,
): Omit<T, 'userSkills'> & { skills: string[] } {
  const { userSkills, ...rest } = user;
  return {
    ...rest,
    skills: userSkills.map((item) => item.skill.name),
  };
}
