"use client";

import { useQuery } from "@tanstack/react-query";

import { StarRating } from "@/components/reviews/star-rating";
import { Skeleton } from "@/components/ui/skeleton";
import { getUserReviewsRequest } from "@/lib/api/reviews";
import { getRoleLabel } from "@/lib/auth/role-labels";
import { formatDate } from "@/lib/format";

type UserReviewsProps = {
  userId: string;
};

export function UserReviews({ userId }: UserReviewsProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["reviews", "user", userId],
    queryFn: () => getUserReviewsRequest(userId),
  });

  if (isLoading) {
    return <Skeleton className="h-32 rounded-[28px]" />;
  }

  if (isError || !data) {
    return null;
  }

  return (
    <section className="rounded-[28px] border border-black/5 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Отзывы и рейтинг
        </h2>
        {data.count > 0 ? (
          <div className="flex items-center gap-2">
            <StarRating value={data.averageRating ?? 0} size="sm" />
            <span className="text-sm font-semibold">
              {data.averageRating?.toFixed(1)}
            </span>
            <span className="text-xs text-muted-foreground">
              ({data.count})
            </span>
          </div>
        ) : null}
      </div>

      {data.reviews.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Отзывов пока нет.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {data.reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-2xl border border-black/5 bg-zinc-50 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm">
                  <span className="font-medium">{review.author.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {getRoleLabel(review.author.role)}
                  </span>
                </div>
                <StarRating value={review.rating} size="sm" />
              </div>
              <p className="mt-2 whitespace-pre-line text-sm leading-6">
                {review.comment}
              </p>
              <div className="mt-1 text-xs text-muted-foreground">
                {formatDate(review.createdAt)}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
