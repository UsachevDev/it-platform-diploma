import { AlertCircle, RefreshCcw } from "lucide-react";

import { cn } from "@/lib/utils";

type ErrorStateProps = {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
};

export function ErrorState({
  title = "Не удалось загрузить данные",
  description = "Проверьте подключение к интернету или попробуйте ещё раз.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50/40 px-6 py-12 text-center",
        className,
      )}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
        <AlertCircle className="h-7 w-7 text-red-500" />
      </div>

      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {description}
      </p>

      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm transition hover:bg-black hover:text-white"
        >
          <RefreshCcw className="h-4 w-4" />
          Попробовать ещё раз
        </button>
      ) : null}
    </div>
  );
}
