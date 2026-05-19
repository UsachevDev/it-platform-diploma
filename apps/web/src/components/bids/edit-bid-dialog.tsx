"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { type Bid, updateBidRequest } from "@/lib/api/bids";
import { getApiErrorMessage } from "@/lib/api/errors";
import { showErrorToast, showSuccessToast } from "@/lib/toast";

type EditBidDialogProps = {
  bid: Bid;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type FormErrors = Partial<{
  price: string;
  durationDays: string;
  coverLetter: string;
}>;

export function EditBidDialog({ bid, open, onOpenChange }: EditBidDialogProps) {
  const queryClient = useQueryClient();

  const [price, setPrice] = useState(String(bid.price));
  const [durationDays, setDurationDays] = useState(String(bid.durationDays));
  const [coverLetter, setCoverLetter] = useState(bid.coverLetter);
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (open) {
      setPrice(String(bid.price));
      setDurationDays(String(bid.durationDays));
      setCoverLetter(bid.coverLetter);
      setErrors({});
    }
  }, [open, bid.price, bid.durationDays, bid.coverLetter]);

  const mutation = useMutation({
    mutationFn: (dto: {
      price: number;
      durationDays: number;
      coverLetter: string;
    }) => updateBidRequest(bid.id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bids", "my"] });
      queryClient.invalidateQueries({
        queryKey: ["bids", "project", bid.projectId],
      });
      queryClient.invalidateQueries({ queryKey: ["project", bid.projectId] });
      showSuccessToast("Отклик обновлён");
      onOpenChange(false);
    },
    onError: (error) => {
      showErrorToast(getApiErrorMessage(error, "Не удалось обновить отклик"));
    },
  });

  function validate(): FormErrors {
    const next: FormErrors = {};

    const priceNumber = Number(price);
    if (price === "" || !Number.isFinite(priceNumber) || priceNumber <= 0) {
      next.price = "Укажите положительную цену.";
    }

    const durationNumber = Number(durationDays);
    if (
      durationDays === "" ||
      !Number.isFinite(durationNumber) ||
      durationNumber <= 0
    ) {
      next.durationDays = "Срок должен быть больше нуля.";
    }

    const trimmed = coverLetter.trim();
    if (trimmed.length === 0) {
      next.coverLetter = "Сопроводительное сообщение не может быть пустым.";
    } else if (trimmed.length > 1000) {
      next.coverLetter = "Не больше 1000 символов.";
    }

    return next;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validation = validate();
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    mutation.mutate({
      price: Number(price),
      durationDays: Number(durationDays),
      coverLetter: coverLetter.trim(),
    });
  }

  const isSubmitting = mutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Изменить отклик</DialogTitle>
          <DialogDescription>
            Можно менять цену, срок и сопроводительное сообщение, пока отклик в
            статусе «На рассмотрении».
          </DialogDescription>
        </DialogHeader>

        <form
          noValidate
          onSubmit={handleSubmit}
          id="edit-bid-form"
          className="space-y-4"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label
                htmlFor="edit-bid-price"
                className="text-sm font-medium"
              >
                Цена, ₽
              </label>
              <input
                id="edit-bid-price"
                type="number"
                inputMode="numeric"
                min={1}
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none transition focus:border-black"
              />
              {errors.price ? (
                <p className="text-xs text-red-600">{errors.price}</p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="edit-bid-duration"
                className="text-sm font-medium"
              >
                Срок, дней
              </label>
              <input
                id="edit-bid-duration"
                type="number"
                inputMode="numeric"
                min={1}
                value={durationDays}
                onChange={(event) => setDurationDays(event.target.value)}
                className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none transition focus:border-black"
              />
              {errors.durationDays ? (
                <p className="text-xs text-red-600">{errors.durationDays}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="edit-bid-cover" className="text-sm font-medium">
              Сопроводительное сообщение
            </label>
            <textarea
              id="edit-bid-cover"
              rows={5}
              value={coverLetter}
              onChange={(event) => setCoverLetter(event.target.value)}
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-black"
            />
            {errors.coverLetter ? (
              <p className="text-xs text-red-600">{errors.coverLetter}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                {coverLetter.trim().length} / 1000
              </p>
            )}
          </div>
        </form>

        <DialogFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex h-10 items-center justify-center rounded-full border border-black/10 bg-white px-4 text-sm transition hover:bg-black/5"
          >
            Отмена
          </button>
          <button
            type="submit"
            form="edit-bid-form"
            disabled={isSubmitting}
            className="inline-flex h-10 items-center justify-center rounded-full bg-black px-5 text-sm text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Сохраняем..." : "Сохранить"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
