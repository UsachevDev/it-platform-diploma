"use client";

import { use } from "react";

import { AdminUserDetailPage } from "@/components/admin/admin-user-detail";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function Page({ params }: PageProps) {
  const { id } = use(params);
  return <AdminUserDetailPage userId={id} />;
}
