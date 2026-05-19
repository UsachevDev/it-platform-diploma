import { Suspense } from "react";

import { PageSkeleton } from "@/components/common/page-skeleton";
import { ProjectsList } from "@/components/projects/projects-list";

export default function ProjectsPage() {
  return (
    <Suspense fallback={<PageSkeleton cards={6} />}>
      <ProjectsList />
    </Suspense>
  );
}
