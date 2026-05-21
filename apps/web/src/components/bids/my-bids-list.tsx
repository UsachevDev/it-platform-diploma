"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FolderKanban } from "lucide-react";

import { MyBidCard } from "@/components/bids/my-bid-card";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { type BidStatus, getMyBidsRequest } from "@/lib/api/bids";
import { useAuth } from "@/providers/auth-provider";

const STATUS_FILTERS: Array<{ value: BidStatus | "ALL"; label: string }> = [
  { value: "ALL", label: "Все" },
  { value: "PENDING", label: "На рассмотрении" },
  { value: "ACCEPTED", label: "Принятые" },
  { value: "REJECTED", label: "Отклонённые" },
];

export function MyBidsList() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();

  useEffect(() => {
    if (!isAuthLoading && user && user.role !== "CONTRACTOR") {
      router.replace("/dashboard");
    }
  }, [isAuthLoading, user, router]);

  const [status, setStatus] = useState<BidStatus | "ALL">("ALL");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["bids", "my"],
    queryFn: getMyBidsRequest,
    enabled: user?.role === "CONTRACTOR",
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    if (status === "ALL") return data;
    return data.filter((bid) => bid.status === status);
  }, [data, status]);

  if (!user || user.role !== "CONTRACTOR") {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Мои отклики</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Отслеживайте статус заявок и быстро переходите к проектам.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 rounded-[28px] border border-black/5 bg-white p-3 shadow-sm">
        {STATUS_FILTERS.map((filter) => {
          const active = filter.value === status;
          return (
            <button
              key={filter.value}
              type="button"
              onClick={() => setStatus(filter.value)}
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
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-44 rounded-[24px]" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={
            !data || data.length === 0
              ? "Откликов пока нет"
              : "Нет откликов с таким статусом"
          }
          description={
            !data || data.length === 0
              ? "Найдите интересный проект в каталоге и отправьте свой первый отклик."
              : "Выберите другой статус или сбросьте фильтр."
          }
          action={
            !data || data.length === 0 ? (
              <Link
                href="/projects"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-black px-4 text-sm text-white transition hover:opacity-90"
              >
                <FolderKanban className="h-4 w-4" />К проектам
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((bid) => (
            <MyBidCard key={bid.id} bid={bid} />
          ))}
        </div>
      )}
    </div>
  );
}
