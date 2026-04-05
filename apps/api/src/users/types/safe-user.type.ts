import { Prisma } from '@prisma/client';

export const safeUserSelect = {
  id: true,
  email: true,
  role: true,
  name: true,
  about: true,
  skills: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.UserSelect;

export type SafeUser = Prisma.UserGetPayload<{
  select: typeof safeUserSelect;
}>;
