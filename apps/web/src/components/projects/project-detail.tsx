"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Mail,
  MessageSquare,
  UserRound,
  Wallet,
  XCircle,
} from "lucide-react";

import { BidsList } from "@/components/bids/bids-list";
import { ContractorBidSection } from "@/components/bids/contractor-bid-section";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { StatusBadge } from "@/components/common/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  cancelProjectRequest,
  completeProjectRequest,
  getProjectByIdRequest,
} from "@/lib/api/projects";
import { getApiErrorMessage } from "@/lib/api/errors";
import { getRoleLabel } from "@/lib/auth/role-labels";
import { formatBudgetRange, formatDateTime } from "@/lib/format";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { useAuth } from "@/providers/auth-provider";

type ProjectDetailProps = {
  projectId: string;
};

export function ProjectDetail({ projectId }: ProjectDetailProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const projectQuery = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => getProjectByIdRequest(projectId),
    retry: (failureCount, error) => {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return false;
      }
      return failureCount < 1;
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelProjectRequest(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      showSuccessToast("Проект отменён");
    },
    onError: (error) => {
      showErrorToast(getApiErrorMessage(error, "Не удалось отменить проект"));
    },
  });

  const completeMutation = useMutation({
    mutationFn: () => completeProjectRequest(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      showSuccessToast("Проект завершён");
    },
    onError: (error) => {
      showErrorToast(getApiErrorMessage(error, "Не удалось завершить проект"));
    },
  });

  if (projectQuery.isLoading) {
    return <ProjectDetailSkeleton />;
  }

  if (projectQuery.isError) {
    const status = axios.isAxiosError(projectQuery.error)
      ? projectQuery.error.response?.status
      : undefined;

    if (status === 404) {
      return (
        <EmptyState
          title="Проект не найден"
          description="Возможно, он был удалён или ссылка устарела."
          action={
            <Link
              href="/projects"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-black px-4 text-sm text-white transition hover:opacity-90"
            >
              <ArrowLeft className="h-4 w-4" />К списку проектов
            </Link>
          }
        />
      );
    }

    return <ErrorState onRetry={() => projectQuery.refetch()} />;
  }

  const project = projectQuery.data;
  if (!project) return null;

  const isOwner = user?.id === project.customerId;
  const isContractor = user?.role === "CONTRACTOR";
  const canCancel = isOwner && project.status === "OPEN";
  const canComplete = isOwner && project.status === "IN_WORK";

  function handleBackToList() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/projects");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <button
          type="button"
          onClick={handleBackToList}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />К списку проектов
        </button>
      </div>

      <div className="rounded-[28px] border border-black/5 bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <StatusBadge status={project.status} />
              <span className="text-xs text-muted-foreground">
                Создан {formatDateTime(project.createdAt)}
              </span>
            </div>
            <h1 className="text-2xl font-semibold sm:text-3xl">
              {project.title}
            </h1>
          </div>

          {(canCancel || canComplete) && (
            <div className="flex flex-wrap gap-2">
              {canComplete && (
                <ConfirmDialog
                  title="Завершить проект?"
                  description="Это действие изменит статус проекта на «Завершён» и его нельзя будет отменить."
                  confirmText="Завершить"
                  onConfirm={() => completeMutation.mutate()}
                  trigger={
                    <button
                      type="button"
                      disabled={completeMutation.isPending}
                      className="inline-flex h-10 items-center gap-2 rounded-full bg-black px-4 text-sm text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Завершить проект
                    </button>
                  }
                />
              )}

              {canCancel && (
                <ConfirmDialog
                  title="Отменить проект?"
                  description="Проект перейдёт в статус «Отменён», новые отклики будут невозможны."
                  confirmText="Отменить проект"
                  cancelText="Назад"
                  onConfirm={() => cancelMutation.mutate()}
                  trigger={
                    <button
                      type="button"
                      disabled={cancelMutation.isPending}
                      className="inline-flex h-10 items-center gap-2 rounded-full border border-black/10 bg-white px-4 text-sm transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <XCircle className="h-4 w-4" />
                      Отменить
                    </button>
                  }
                />
              )}
            </div>
          )}
        </div>

        <p className="mt-6 whitespace-pre-line text-sm leading-6 text-foreground/90">
          {project.description}
        </p>

        <div className="mt-6 grid gap-4 border-t border-black/5 pt-6 sm:grid-cols-2">
          <InfoRow
            icon={<Wallet className="h-4 w-4 text-zinc-400" />}
            label="Бюджет"
            value={formatBudgetRange(project.budgetMin, project.budgetMax)}
          />
          <InfoRow
            icon={<MessageSquare className="h-4 w-4 text-zinc-400" />}
            label="Откликов"
            value={String(project._count.bids)}
          />
          <InfoRow
            icon={<UserRound className="h-4 w-4 text-zinc-400" />}
            label="Заказчик"
            value={`${project.customer.name} · ${getRoleLabel(project.customer.role)}`}
          />
          <InfoRow
            icon={<Mail className="h-4 w-4 text-zinc-400" />}
            label="Email"
            value={project.customer.email}
          />

          {project.selectedContractor && (
            <InfoRow
              icon={<UserRound className="h-4 w-4 text-zinc-400" />}
              label="Исполнитель"
              value={project.selectedContractor.name}
            />
          )}

          <InfoRow
            icon={<CalendarDays className="h-4 w-4 text-zinc-400" />}
            label="Обновлён"
            value={formatDateTime(project.updatedAt)}
          />
        </div>
      </div>

      {isContractor && !isOwner && (
        <ContractorBidSection
          projectId={project.id}
          projectStatus={project.status}
        />
      )}

      {isOwner && (
        <BidsList projectId={project.id} projectStatus={project.status} />
      )}

      <button
        type="button"
        onClick={() => router.back()}
        className="text-xs text-muted-foreground underline-offset-4 hover:underline"
      >
        Назад
      </button>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5">{icon}</div>
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="truncate text-sm font-medium">{value}</div>
      </div>
    </div>
  );
}

function ProjectDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-32" />
      <div className="rounded-[28px] border border-black/5 bg-white p-6 shadow-sm md:p-8">
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="mt-4 h-8 w-2/3" />
        <div className="mt-6 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="mt-6 grid gap-3 border-t border-black/5 pt-6 sm:grid-cols-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  );
}
