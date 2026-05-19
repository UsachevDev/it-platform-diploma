import Link from "next/link";
import { ArrowRight, CalendarDays, Clock, Wallet } from "lucide-react";

import { BidActions } from "@/components/bids/bid-actions";
import { StatusBadge } from "@/components/common/status-badge";
import type { Bid } from "@/lib/api/bids";
import { formatDate, formatRubles } from "@/lib/format";

type MyBidCardProps = {
  bid: Bid;
};

export function MyBidCard({ bid }: MyBidCardProps) {
  const projectTitle = bid.project?.title ?? "Проект";

  return (
    <div className="rounded-[24px] border border-black/5 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/projects/${bid.projectId}`}
            className="line-clamp-1 text-base font-semibold transition hover:underline"
          >
            {projectTitle}
          </Link>

          {bid.project?.status ? (
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <span>Проект:</span>
              <StatusBadge status={bid.project.status} />
            </div>
          ) : null}
        </div>

        <StatusBadge status={bid.status} />
      </div>

      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Wallet className="h-4 w-4 text-zinc-400" />
          <span className="font-medium text-foreground">
            {formatRubles(bid.price)}
          </span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-4 w-4 text-zinc-400" />
          <span className="font-medium text-foreground">
            {bid.durationDays} дн.
          </span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <CalendarDays className="h-4 w-4 text-zinc-400" />
          <span>{formatDate(bid.createdAt)}</span>
        </div>
      </div>

      <p className="mt-4 line-clamp-2 text-sm text-muted-foreground">
        {bid.coverLetter}
      </p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/projects/${bid.projectId}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-foreground transition hover:gap-2"
        >
          К проекту
          <ArrowRight className="h-4 w-4" />
        </Link>

        <BidActions bid={bid} size="sm" />
      </div>
    </div>
  );
}
