"use client";

import { useEffect, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { BlockUserDto } from "@/lib/api/admin";

type DurationOption = {
  label: string;
  days?: number;
};

const DURATION_OPTIONS: DurationOption[] = [
  { label: "1 день", days: 1 },
  { label: "3 дня", days: 3 },
  { label: "7 дней", days: 7 },
  { label: "30 дней", days: 30 },
  { label: "Навсегда" },
];

type BlockUserDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
  onConfirm: (dto: BlockUserDto) => void;
  isSubmitting?: boolean;
};

export function BlockUserDialog({
  open,
  onOpenChange,
  userName,
  onConfirm,
  isSubmitting = false,
}: BlockUserDialogProps) {
  const [reason, setReason] = useState("");
  const [durationIndex, setDurationIndex] = useState(2);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setReason("");
      setDurationIndex(2);
      setError(null);
    }
  }, [open]);

  function handleConfirm() {
    const trimmed = reason.trim();
    if (trimmed.length < 3) {
      setError("Укажите причину (минимум 3 символа).");
      return;
    }
    onConfirm({
      reason: trimmed,
      durationDays: DURATION_OPTIONS[durationIndex].days,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Заблокировать пользователя</DialogTitle>
          <DialogDescription>
            {userName} не сможет входить в систему. Причина и срок будут
            показаны при попытке входа.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="block-reason" className="text-sm font-medium">
              Причина блокировки
            </label>
            <textarea
              id="block-reason"
              rows={3}
              value={reason}
              onChange={(event) => {
                setReason(event.target.value);
                setError(null);
              }}
              placeholder="Например: спам в откликах, нарушение правил"
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-black"
            />
            {error ? (
              <p className="text-xs text-red-600">{error}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium">Срок блокировки</span>
            <div className="flex flex-wrap gap-2">
              {DURATION_OPTIONS.map((option, index) => {
                const active = index === durationIndex;
                return (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => setDurationIndex(index)}
                    className={`rounded-full border px-4 py-1.5 text-xs font-medium transition ${
                      active
                        ? "border-black bg-black text-white"
                        : "border-black/10 bg-white text-muted-foreground hover:border-black/20 hover:text-foreground"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex h-10 items-center justify-center rounded-full border border-black/10 bg-white px-4 text-sm transition hover:bg-black/5"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="inline-flex h-10 items-center justify-center rounded-full bg-red-500 px-5 text-sm text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Блокируем..." : "Заблокировать"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
