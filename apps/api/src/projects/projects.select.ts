import { Prisma } from '@prisma/client';

export const projectSelect = {
  id: true,
  customerId: true,
  categoryId: true,
  title: true,
  description: true,
  budgetMin: true,
  budgetMax: true,
  status: true,
  selectedContractorId: true,
  createdAt: true,
  updatedAt: true,
  customer: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  },
  selectedContractor: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  },
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  _count: {
    select: {
      bids: true,
    },
  },
} satisfies Prisma.ProjectSelect;
