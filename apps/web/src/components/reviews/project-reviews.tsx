"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Send } from "lucide-react";

import { StarRating } from "@/components/reviews/star-rating";
import { ErrorState } from "@/components/common/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  type Review,
  createReviewRequest,
  getProjectReviewsRequest,
} from "@/lib/api/reviews";
import { getApiErrorMessage } from "@/lib/api/errors";
import type { Project } from "@/lib/api/projects";
import { getRoleLabel } from "@/lib/auth/role-labels";
import { formatDate } from "@/lib/format";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { useAuth } from "@/providers/auth-provider";

type ProjectReviewsProps = {
  project: Project;
};

export function ProjectReviews({ project }: ProjectReviewsProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["reviews", "project", project.id],
    queryFn: () => getProjectReviewsRequest(project.id),
  });

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      createReviewRequest(project.id, { rating, comment: comment.trim() }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["reviews", "project", project.id],
      });
      showSuccessToast("Отзыв оставлен");
      setComment("");
      setRating(5);
      setError(null);
    },
    onError: (err) =>
      showErrorToast(getApiErrorMessage(err, "Не удалось оставить отзыв")),
  });

  if (project.status !== "DONE") {
    return null;
  }

  const isParticipant =
    user?.id === project.customerId ||
    user?.id === project.selectedContractorId;

  const alreadyReviewed = Boolean(
    data?.some((review) => review.author.id === user?.id),
  );

  const canReview = isParticipant && !alreadyReviewed;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (comment.trim().length < 3) {
      setError("Напишите отзыв (минимум 3 символа).");
      return;
    }
    setError(null);
    mutation.mutate();
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold tracking-tight">Отзывы по проекту</h2>

      {canReview ? (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-[28px] border border-black/5 bg-white p-6 shadow-sm"
        >
          <div className="space-y-1.5">
            <span className="text-sm font-medium">Ваша оценка</span>
            <StarRating value={rating} onChange={setRating} size="lg" />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="review-comment" className="text-sm font-medium">
              Комментарий
            </label>
            <textarea
              id="review-comment"
              rows={4}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Расскажите о сотрудничестве"
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-black"
            />
            {error ? <p className="text-xs text-red-600">{error}</p> : null}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="inline-flex h-11 items-center gap-2 rounded-2xl bg-black px-5 text-sm text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {mutation.isPending ? "Отправляем..." : "Оставить отзыв"}
              {!mutation.isPending ? <Send className="h-4 w-4" /> : null}
            </button>
          </div>
        </form>
      ) : null}

      {isLoading ? (
        <Skeleton className="h-28 rounded-[24px]" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data || data.length === 0 ? (
        <p className="rounded-[24px] border border-dashed border-black/10 bg-white px-6 py-8 text-center text-sm text-muted-foreground">
          Отзывов по проекту пока нет.
        </p>
      ) : (
        <div className="space-y-3">
          {data.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </section>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="rounded-[24px] border border-black/5 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="font-medium">{review.author.name}</span>
          <span className="ml-2 text-xs text-muted-foreground">
            {getRoleLabel(review.author.role)} → {review.target.name}
          </span>
        </div>
        <StarRating value={review.rating} size="sm" />
      </div>
      <p className="mt-3 whitespace-pre-line text-sm leading-6">
        {review.comment}
      </p>
      <div className="mt-2 text-xs text-muted-foreground">
        {formatDate(review.createdAt)}
      </div>
    </div>
  );
}
