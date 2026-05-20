"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Ban,
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  Search,
  ShieldCheck,
  Undo2,
} from "lucide-react";

import { AdminGuard } from "@/components/admin/admin-guard";
import { BlockUserDialog } from "@/components/admin/block-user-dialog";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  type AdminUser,
  type AdminUsersQuery,
  type BlockUserDto,
  blockUserRequest,
  getAdminUsersRequest,
  unblockUserRequest,
} from "@/lib/api/admin";
import { getApiErrorMessage } from "@/lib/api/errors";
import type { UserRole } from "@/lib/auth/auth-types";
import { getRoleLabel } from "@/lib/auth/role-labels";
import { formatDate } from "@/lib/format";
import { showErrorToast, showSuccessToast } from "@/lib/toast";

const PAGE_LIMIT = 10;

const ROLE_FILTERS: Array<{ value: UserRole | "ALL"; label: string }> = [
  { value: "ALL", label: "Все роли" },
  { value: "CUSTOMER", label: "Заказчики" },
  { value: "CONTRACTOR", label: "Исполнители" },
  { value: "ADMIN", label: "Админы" },
];

export function AdminUsersPage() {
  return (
    <AdminGuard>
      <AdminUsersList />
    </AdminGuard>
  );
}

function AdminUsersList() {
  const queryClient = useQueryClient();

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<UserRole | "ALL">("ALL");
  const [onlyBlocked, setOnlyBlocked] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const query: AdminUsersQuery = {
    page,
    limit: PAGE_LIMIT,
    search: search || undefined,
    role: role === "ALL" ? undefined : role,
    blocked: onlyBlocked || undefined,
  };

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["admin", "users", query],
    queryFn: () => getAdminUsersRequest(query),
    placeholderData: keepPreviousData,
  });

  const [blockTarget, setBlockTarget] = useState<AdminUser | null>(null);

  const blockMutation = useMutation({
    mutationFn: (vars: { userId: string; dto: BlockUserDto }) =>
      blockUserRequest(vars.userId, vars.dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      setBlockTarget(null);
      showSuccessToast("Пользователь заблокирован");
    },
    onError: (error) =>
      showErrorToast(getApiErrorMessage(error, "Не удалось заблокировать")),
  });

  const unblockMutation = useMutation({
    mutationFn: unblockUserRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      showSuccessToast("Пользователь разблокирован");
    },
    onError: (error) =>
      showErrorToast(getApiErrorMessage(error, "Не удалось разблокировать")),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Пользователи</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Управление аккаунтами платформы и блокировками.
        </p>
      </div>

      <div className="space-y-3 rounded-[28px] border border-black/5 bg-white p-4 shadow-sm">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Поиск по имени или email"
            className="h-11 w-full rounded-full border border-black/10 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-black"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {ROLE_FILTERS.map((filter) => {
            const active = filter.value === role;
            return (
              <button
                key={filter.value}
                type="button"
                onClick={() => {
                  setRole(filter.value);
                  setPage(1);
                }}
                className={`rounded-full border px-4 py-1.5 text-xs font-medium transition ${
                  active
                    ? "border-black bg-black text-white"
                    : "border-black/10 bg-white text-muted-foreground hover:border-black/20 hover:text-foreground"
                }`}
              >
                {filter.label}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => {
              setOnlyBlocked((prev) => !prev);
              setPage(1);
            }}
            className={`rounded-full border px-4 py-1.5 text-xs font-medium transition ${
              onlyBlocked
                ? "border-red-500 bg-red-500 text-white"
                : "border-black/10 bg-white text-muted-foreground hover:border-black/20 hover:text-foreground"
            }`}
          >
            Только заблокированные
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-[24px]" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data || data.data.length === 0 ? (
        <EmptyState
          title="Пользователи не найдены"
          description="Измените условия поиска или фильтры."
        />
      ) : (
        <>
          <div
            className={`space-y-3 ${isFetching ? "opacity-70 transition" : ""}`}
          >
            {data.data.map((adminUser) => (
              <UserRow
                key={adminUser.id}
                user={adminUser}
                onBlock={() => setBlockTarget(adminUser)}
                onUnblock={() => unblockMutation.mutate(adminUser.id)}
                isBusy={
                  blockMutation.isPending || unblockMutation.isPending
                }
              />
            ))}
          </div>

          <Pagination
            page={data.meta.page}
            totalPages={data.meta.totalPages}
            onChange={setPage}
          />
        </>
      )}

      <BlockUserDialog
        open={blockTarget !== null}
        onOpenChange={(open) => {
          if (!open) setBlockTarget(null);
        }}
        userName={blockTarget?.name ?? ""}
        isSubmitting={blockMutation.isPending}
        onConfirm={(dto) => {
          if (blockTarget) {
            blockMutation.mutate({ userId: blockTarget.id, dto });
          }
        }}
      />
    </div>
  );
}

function UserRow({
  user,
  onBlock,
  onUnblock,
  isBusy,
}: {
  user: AdminUser;
  onBlock: () => void;
  onUnblock: () => void;
  isBusy: boolean;
}) {
  const isAdmin = user.role === "ADMIN";

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-[24px] border border-black/5 bg-white p-5 shadow-sm">
      <div className="flex min-w-0 items-center gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-base font-semibold uppercase ${
            user.isBlocked
              ? "bg-red-100 text-red-600"
              : "bg-black text-white"
          }`}
        >
          {user.name.charAt(0)}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/admin/users/${user.id}`}
              className="font-medium transition hover:underline"
            >
              {user.name}
            </Link>
            <span className="inline-flex items-center gap-1 rounded-full bg-black/5 px-2 py-0.5 text-[11px] font-medium">
              {isAdmin ? <ShieldCheck className="h-3 w-3" /> : null}
              {getRoleLabel(user.role)}
            </span>
            {user.isBlocked ? (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-700">
                Заблокирован
              </span>
            ) : null}
          </div>
          <div className="mt-0.5 truncate text-sm text-muted-foreground">
            {user.email}
          </div>
          <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <FolderKanban className="h-3.5 w-3.5" />
              Проектов: {user._count.customerProjects}
            </span>
            <span className="inline-flex items-center gap-1">
              <BriefcaseBusiness className="h-3.5 w-3.5" />
              Откликов: {user._count.contractorBids}
            </span>
            <span>С нами с {formatDate(user.createdAt)}</span>
          </div>
        </div>
      </div>

      {!isAdmin ? (
        user.isBlocked ? (
          <ConfirmDialog
            title="Разблокировать пользователя?"
            description={`${user.name} снова сможет входить и пользоваться платформой.`}
            confirmText="Разблокировать"
            onConfirm={onUnblock}
            trigger={
              <button
                type="button"
                disabled={isBusy}
                className="inline-flex h-9 items-center gap-2 rounded-full border border-black/10 bg-white px-4 text-sm transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Undo2 className="h-4 w-4" />
                Разблокировать
              </button>
            }
          />
        ) : (
          <button
            type="button"
            disabled={isBusy}
            onClick={onBlock}
            className="inline-flex h-9 items-center gap-2 rounded-full border border-black/10 bg-white px-4 text-sm transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Ban className="h-4 w-4" />
            Заблокировать
          </button>
        )
      ) : (
        <span className="text-xs text-muted-foreground">
          Администратора нельзя заблокировать
        </span>
      )}
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 pt-2">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white text-muted-foreground transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Предыдущая страница"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="px-3 text-sm text-muted-foreground">
        Страница <span className="font-medium text-foreground">{page}</span> из{" "}
        {totalPages}
      </span>
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white text-muted-foreground transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Следующая страница"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
