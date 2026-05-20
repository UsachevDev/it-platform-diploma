"use client";

import { useState } from "react";
import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

type StarRatingProps = {
  /** Текущее значение (0–5). Для дробных значений показывает округление. */
  value: number;
  /** Если задан — компонент интерактивный. */
  onChange?: (value: number) => void;
  size?: "sm" | "md" | "lg";
};

const SIZE_CLASS = {
  sm: "h-3.5 w-3.5",
  md: "h-5 w-5",
  lg: "h-6 w-6",
} as const;

export function StarRating({ value, onChange, size = "md" }: StarRatingProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const interactive = typeof onChange === "function";
  const display = hovered ?? value;

  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= Math.round(display);
        return (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => onChange?.(star)}
            onMouseEnter={() => interactive && setHovered(star)}
            onMouseLeave={() => interactive && setHovered(null)}
            aria-label={`Оценка ${star}`}
            className={cn(
              "transition",
              interactive ? "cursor-pointer" : "cursor-default",
            )}
          >
            <Star
              className={cn(
                SIZE_CLASS[size],
                filled
                  ? "fill-amber-400 text-amber-400"
                  : "fill-transparent text-zinc-300",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
