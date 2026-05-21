"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Ban,
  CalendarDays,
  Mail,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Undo2,
} from "lucide-react";

import { AdminGuard } from "@/components/admin/admin-guard";
import { BlockUserDialog } from "@/components/admin/block-user-dialog";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { ErrorState } from "@/components/common/error-state";
import { SelectMenu } from "@/components/common/select-menu";
import { StatusBadge } from "@/components/common/status-badge";
import { UserReviews } from "@/components/reviews/user-reviews";
import { Skeleton } from "@/components/ui/skeleton";
import {
  type AdminUserDetail,
  type BlockUserDto,
  blockUserRequest,
  deleteUserRequest,
  getAdminUserDetailRequest,
  unblockUserRequest,
  updateUserRoleRequest,
} from "@/lib/api/admin";
import { getApiErrorMessage } from "@/lib/api/errors";
import type { UserRole } from "@/lib/auth/auth-types";
import { getRoleLabel } from "@/lib/auth/role-labels";
import { formatBudgetRange, formatDate } from "@/lib/format";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { useAuth } from "@/providers/auth-provider";

const ROLE_OPTIONS = [
  { value: "CUSTOMER" as UserRole, label: "Заказчик" },
  { value: "CONTRACTOR" as UserRole, label: "Исполнитель" },
  { value: "ADMIN" as UserRole, label: "Администратор" },
];

export function AdminUserDetailPage({ userId }: { userId: string }) {
  return (
    <AdminGuard>
      <AdminUserDetailContent userId={userId} />
    </AdminGuard>
  );
}

function AdminUserDetailContent({ userId }: { userId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user: currentAdmin } = useAuth();
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "user", userId],
    queryFn: () => getAdminUserDetailRequest(userId),
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["admin", "user", userId] });
    queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
  }

  const blockMutation = useMutation({
    mutationFn: (dto: BlockUserDto) => blockUserRequest(userId, dto),
    onSuccess: () => {
      invalidate();
      setBlockDialogOpen(false);
      showSuccessToast("Пользователь заблокирован");
    },
    onError: (error) => showErrorToast(getApiErrorMessage(error)),
  });

  const unblockMutation = useMutation({
    mutationFn: () => unblockUserRequest(userId),
    onSuccess: () => {
      invalidate();
      showSuccessToast("Пользователь разблокирован");
    },
    onError: (error) => showErrorToast(getApiErrorMessage(error)),
  });

  const roleMutation = useMutation({
    mutationFn: (role: UserRole) => updateUserRoleRequest(userId, role),
    onSuccess: () => {
      invalidate();
      showSuccessToast("Роль изменена");
    },
    onError: (error) => showErrorToast(getApiErrorMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteUserRequest(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      showSuccessToast("Пользователь удалён");
      router.replace("/admin/users");
    },
    onError: (error) => showErrorToast(getApiErrorMessage(error)),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-48 rounded-[28px]" />
        <Skeleton className="h-32 rounded-[28px]" />
      </div>
    );
  }

  if (isError || !data) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  const isSelf = currentAdmin?.id === data.id;
  const isAdminTarget = data.role === "ADMIN";
  const canManage = !isSelf && !isAdminTarget;

  return (
    <div className="space-y-6">
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />К списку пользователей
      </Link>

      <div className="rounded-[28px] border border-black/5 bg-white p-6 shadow-sm md:p-8">
        <div className="flex items-center gap-4">
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-semibold uppercase ${
              data.isBlocked
                ? "bg-red-100 text-red-600"
                : "bg-black text-white"
            }`}
          >
            {data.name.charAt(0)}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold">{data.name}</h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-black/5 px-2 py-0.5 text-[11px] font-medium">
                {data.role === "ADMIN" ? (
                  <ShieldCheck className="h-3 w-3" />
                ) : null}
                {getRoleLabel(data.role)}
              </span>
              {data.isBlocked ? (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-700">
                  Заблокирован
                </span>
              ) : null}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" />
                {data.email}
              </span>
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />С нами с{" "}
                {formatDate(data.createdAt)}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-5 border-t border-black/5 pt-6">
          <section>
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              О себе
            </h2>
            <p className="mt-1 text-sm leading-6">
              {data.about?.trim() || "—"}
            </p>
          </section>

          <section>
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Навыки
            </h2>
            {data.skills.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {data.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full bg-black/5 px-3 py-1 text-xs font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">—</p>
            )}
          </section>
        </div>
      </div>

      {data.isBlocked ? (
        <div className="rounded-[28px] border border-red-100 bg-red-50/50 p-6">
          <div className="flex items-center gap-2 text-red-700">
            <ShieldAlert className="h-5 w-5" />
            <h2 className="text-sm font-semibold uppercase tracking-wide">
              Аккаунт заблокирован
            </h2>
          </div>
          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <span className="text-muted-foreground">Причина:</span>{" "}
              <span className="font-medium">{data.blockReason || "—"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Срок:</span>{" "}
              <span className="font-medium">
                {data.blockedUntil
                  ? `до ${formatDate(data.blockedUntil)}`
                  : "бессрочно"}
              </span>
            </div>
          </div>
        </div>
      ) : null}

      <div className="rounded-[28px] border border-black/5 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Управление
        </h2>

        {isSelf ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Это ваш аккаунт — управление недоступно.
          </p>
        ) : isAdminTarget ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Действия над другим администратором недоступны.
          </p>
        ) : (
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <span className="text-xs text-muted-foreground">Роль</span>
              <SelectMenu
                className="w-52"
                ariaLabel="Роль пользователя"
                value={data.role}
                options={ROLE_OPTIONS}
                onChange={(role) => roleMutation.mutate(role)}
              />
            </div>

            {data.isBlocked ? (
              <ConfirmDialog
                title="Разблокировать пользователя?"
                description={`${data.name} снова сможет входить в систему.`}
                confirmText="Разблокировать"
                onConfirm={() => unblockMutation.mutate()}
                trigger={
                  <button
                    type="button"
                    disabled={!canManage}
                    className="inline-flex h-11 items-center gap-2 rounded-full border border-black/10 bg-white px-4 text-sm transition hover:bg-black hover:text-white"
                  >
                    <Undo2 className="h-4 w-4" />
                    Разблокировать
                  </button>
                }
              />
            ) : (
              <button
                type="button"
                disabled={!canManage}
                onClick={() => setBlockDialogOpen(true)}
                className="inline-flex h-11 items-center gap-2 rounded-full border border-black/10 bg-white px-4 text-sm transition hover:bg-red-50 hover:text-red-600"
              >
                <Ban className="h-4 w-4" />
                Заблокировать
              </button>
            )}

            <ConfirmDialog
              title="Удалить пользователя?"
              description="Аккаунт и все связанные проекты и отклики будут удалены безвозвратно."
              confirmText="Удалить"
              cancelText="Назад"
              onConfirm={() => deleteMutation.mutate()}
              trigger={
                <button
                  type="button"
                  disabled={!canManage || deleteMutation.isPending}
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 text-sm text-red-600 transition hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" />
                  Удалить аккаунт
                </button>
              }
            />
          </div>
        )}
      </div>

      <UserProjectsBids data={data} />

      <UserReviews userId={data.id} />

      <BlockUserDialog
        open={blockDialogOpen}
        onOpenChange={setBlockDialogOpen}
        userName={data.name}
        onConfirm={(dto) => blockMutation.mutate(dto)}
        isSubmitting={blockMutation.isPending}
      />
    </div>
  );
}

function UserProjectsBids({ data }: { data: AdminUserDetail }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-[28px] border border-black/5 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-medium">
          Проекты заказчика ({data.customerProjects.length})
        </h2>
        {data.customerProjects.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Проектов нет.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {data.customerProjects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="flex items-center justify-between gap-3 rounded-2xl border border-black/5 px-4 py-3 text-sm transition hover:bg-black/[0.02]"
              >
                <span className="min-w-0 truncate">{project.title}</span>
                <StatusBadge status={project.status} />
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-[28px] border border-black/5 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-medium">
          Отклики исполнителя ({data.contractorBids.length})
        </h2>
        {data.contractorBids.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Откликов нет.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {data.contractorBids.map((bid) => (
              <Link
                key={bid.id}
                href={`/projects/${bid.projectId}`}
                className="flex items-center justify-between gap-3 rounded-2xl border border-black/5 px-4 py-3 text-sm transition hover:bg-black/[0.02]"
              >
                <span className="min-w-0 truncate">
                  {bid.project?.title ?? "Проект"} ·{" "}
                  {formatBudgetRange(bid.price, bid.price)}
                </span>
                <StatusBadge status={bid.status} />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
