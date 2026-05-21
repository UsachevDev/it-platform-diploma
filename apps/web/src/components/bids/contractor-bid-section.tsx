"use client";

import { useQuery } from "@tanstack/react-query";
import { Clock, Info } from "lucide-react";

import { BidActions } from "@/components/bids/bid-actions";
import { BidForm } from "@/components/bids/bid-form";
import { ErrorState } from "@/components/common/error-state";
import { StatusBadge } from "@/components/common/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getMyBidsRequest } from "@/lib/api/bids";
import type { ProjectStatus } from "@/lib/api/projects";
import { formatDateTime, formatRubles } from "@/lib/format";

type ContractorBidSectionProps = {
  projectId: string;
  projectStatus: ProjectStatus;
};

export function ContractorBidSection({
  projectId,
  projectStatus,
}: ContractorBidSectionProps) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["bids", "my"],
    queryFn: getMyBidsRequest,
    staleTime: 30_000,
  });

  if (isLoading) {
    return <Skeleton className="h-44 rounded-[28px]" />;
  }

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  const existingBid = data?.find((bid) => bid.projectId === projectId);

  if (existingBid) {
    return (
      <section className="rounded-[28px] border border-black/5 bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-zinc-400" />
            <h3 className="text-lg font-semibold">Вы откликнулись</h3>
          </div>
          <StatusBadge status={existingBid.status} />
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div>
            <div className="text-xs text-muted-foreground">Ваша цена</div>
            <div className="text-base font-medium">
              {formatRubles(existingBid.price)}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Срок</div>
            <div className="flex items-center gap-1 text-base font-medium">
              <Clock className="h-4 w-4 text-zinc-400" />
              {existingBid.durationDays} дн.
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Отправлен</div>
            <div className="text-sm font-medium">
              {formatDateTime(existingBid.createdAt)}
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-black/5 bg-zinc-50 p-4">
          <div className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
            Сопроводительное сообщение
          </div>
          <p className="whitespace-pre-line text-sm leading-6">
            {existingBid.coverLetter}
          </p>
        </div>

        <div className="mt-5 flex justify-end">
          <BidActions
            bid={{ ...existingBid, project: { ...existingBid.project, id: projectId, title: existingBid.project?.title ?? "", status: projectStatus } }}
          />
        </div>
      </section>
    );
  }

  if (projectStatus !== "OPEN") {
    return (
      <section className="rounded-[28px] border border-dashed border-black/10 bg-white p-6 text-sm text-muted-foreground shadow-sm">
        Отклики принимаются только для открытых проектов.
      </section>
    );
  }

  return <BidForm projectId={projectId} />;
}
