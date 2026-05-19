"use client";

import { use } from "react";

import { ProjectDetail } from "@/components/projects/project-detail";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function ProjectDetailPage({ params }: PageProps) {
  const { id } = use(params);
  return <ProjectDetail projectId={id} />;
}
