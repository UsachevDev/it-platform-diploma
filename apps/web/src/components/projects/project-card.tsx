import Link from "next/link";
import { CalendarDays, MessageSquare, UserRound, Wallet } from "lucide-react";

import { StatusBadge } from "@/components/common/status-badge";
import { formatBudgetRange, formatDate } from "@/lib/format";
import type { Project } from "@/lib/api/projects";

type ProjectCardProps = {
  project: Project;
};

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link
      href={`/projects/${project.id}`}
      className="group flex h-full flex-col rounded-[28px] border border-black/10 bg-white p-6 shadow-sm transition hover:border-black/20 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="line-clamp-1 text-base font-semibold transition group-hover:underline">
          {project.title}
        </h3>
        <StatusBadge status={project.status} />
      </div>

      <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
        {project.description}
      </p>

      <div className="mt-5 grid gap-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-zinc-400" />
          <span className="font-medium text-foreground">
            {formatBudgetRange(project.budgetMin, project.budgetMax)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <UserRound className="h-4 w-4 text-zinc-400" />
          <span className="truncate">{project.customer.name}</span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-zinc-400" />
            <span>{formatDate(project.createdAt)}</span>
          </div>

          <div className="flex items-center gap-1 text-xs">
            <MessageSquare className="h-3.5 w-3.5" />
            <span>{project._count.bids}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
