"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Clock, Mail, UserRound, X } from "lucide-react";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { StatusBadge } from "@/components/common/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  type Bid,
  acceptBidRequest,
  getBidsByProjectRequest,
  rejectBidRequest,
} from "@/lib/api/bids";
import { getApiErrorMessage } from "@/lib/api/errors";
import type { ProjectStatus } from "@/lib/api/projects";
import { formatDateTime, formatRubles } from "@/lib/format";
import { showErrorToast, showSuccessToast } from "@/lib/toast";

type BidsListProps = {
  projectId: string;
  projectStatus: ProjectStatus;
};

export function BidsList({ projectId, projectStatus }: BidsListProps) {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["bids", "project", projectId],
    queryFn: () => getBidsByProjectRequest(projectId),
  });

  function invalidateAfterDecision() {
    queryClient.invalidateQueries({ queryKey: ["project", projectId] });
    queryClient.invalidateQueries({ queryKey: ["bids", "project", projectId] });
    queryClient.invalidateQueries({ queryKey: ["projects"] });
  }

  const acceptMutation = useMutation({
    mutationFn: acceptBidRequest,
    onSuccess: () => {
      invalidateAfterDecision();
      showSuccessToast("Исполнитель выбран, проект переведён в работу");
    },
    onError: (error) => {
      showErrorToast(getApiErrorMessage(error, "Не удалось принять отклик"));
    },
  });

  const rejectMutation = useMutation({
    mutationFn: rejectBidRequest,
    onSuccess: () => {
      invalidateAfterDecision();
      showSuccessToast("Отклик отклонён");
    },
    onError: (error) => {
      showErrorToast(getApiErrorMessage(error, "Не удалось отклонить отклик"));
    },
  });

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-xl font-semibold tracking-tight">
          Отклики на проект
        </h2>
        {data ? (
          <span className="text-sm text-muted-foreground">
            Всего: {data.length}
          </span>
        ) : null}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, index) => (
            <Skeleton key={index} className="h-36 rounded-[24px]" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data || data.length === 0 ? (
        <EmptyState
          title="Откликов пока нет"
          description="Как только исполнители заинтересуются проектом, их отклики появятся здесь."
        />
      ) : (
        <div className="space-y-3">
          {data.map((bid) => (
            <BidCard
              key={bid.id}
              bid={bid}
              projectStatus={projectStatus}
              isAccepting={
                acceptMutation.isPending &&
                acceptMutation.variables === bid.id
              }
              isRejecting={
                rejectMutation.isPending &&
                rejectMutation.variables === bid.id
              }
              onAccept={() => acceptMutation.mutate(bid.id)}
              onReject={() => rejectMutation.mutate(bid.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

type BidCardProps = {
  bid: Bid;
  projectStatus: ProjectStatus;
  isAccepting: boolean;
  isRejecting: boolean;
  onAccept: () => void;
  onReject: () => void;
};

function BidCard({
  bid,
  projectStatus,
  isAccepting,
  isRejecting,
  onAccept,
  onReject,
}: BidCardProps) {
  const canDecide =
    projectStatus === "OPEN" && bid.status === "PENDING";

  return (
    <div className="rounded-[24px] border border-black/5 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <UserRound className="h-4 w-4 text-zinc-400" />
            <span className="font-medium">
              {bid.contractor?.name ?? "Исполнитель"}
            </span>
            <StatusBadge status={bid.status} />
          </div>

          {bid.contractor?.email ? (
            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <Mail className="h-3.5 w-3.5" />
              {bid.contractor.email}
            </div>
          ) : null}
        </div>

        <div className="text-right">
          <div className="text-base font-semibold">{formatRubles(bid.price)}</div>
          <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            {bid.durationDays} дн.
          </div>
        </div>
      </div>

      <p className="mt-4 whitespace-pre-line text-sm leading-6 text-foreground/90">
        {bid.coverLetter}
      </p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">
          Отправлен {formatDateTime(bid.createdAt)}
        </span>

        {canDecide ? (
          <div className="flex flex-wrap gap-2">
            <ConfirmDialog
              title="Принять отклик?"
              description={`Проект перейдёт в работу с исполнителем ${bid.contractor?.name ?? ""}. Остальные отклики будут отклонены.`}
              confirmText="Принять"
              onConfirm={onAccept}
              trigger={
                <button
                  type="button"
                  disabled={isAccepting || isRejecting}
                  className="inline-flex h-9 items-center gap-2 rounded-full bg-black px-4 text-sm text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Check className="h-4 w-4" />
                  Принять
                </button>
              }
            />

            <ConfirmDialog
              title="Отклонить отклик?"
              description="Исполнитель увидит, что отклик отклонён."
              confirmText="Отклонить"
              cancelText="Назад"
              onConfirm={onReject}
              trigger={
                <button
                  type="button"
                  disabled={isAccepting || isRejecting}
                  className="inline-flex h-9 items-center gap-2 rounded-full border border-black/10 bg-white px-4 text-sm transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <X className="h-4 w-4" />
                  Отклонить
                </button>
              }
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
