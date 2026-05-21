"use client";

import { useState } from "react";
import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Send } from "lucide-react";

import { createBidRequest } from "@/lib/api/bids";
import { getApiErrorMessage } from "@/lib/api/errors";
import { showErrorToast, showSuccessToast } from "@/lib/toast";

type BidFormProps = {
  projectId: string;
};

type FormErrors = Partial<{
  price: string;
  durationDays: string;
  coverLetter: string;
}>;

export function BidForm({ projectId }: BidFormProps) {
  const queryClient = useQueryClient();

  const [price, setPrice] = useState("");
  const [durationDays, setDurationDays] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});

  const mutation = useMutation({
    mutationFn: (dto: {
      price: number;
      durationDays: number;
      coverLetter: string;
    }) => createBidRequest(projectId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["bids", "my"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      showSuccessToast("Отклик отправлен");
      setPrice("");
      setDurationDays("");
      setCoverLetter("");
      setErrors({});
    },
    onError: (error) => {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        showErrorToast(
          getApiErrorMessage(error, "Вы уже отправили отклик на этот проект"),
        );
        return;
      }
      showErrorToast(getApiErrorMessage(error, "Не удалось отправить отклик"));
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

    const trimmedCover = coverLetter.trim();
    if (trimmedCover.length === 0) {
      next.coverLetter = "Напишите сопроводительное сообщение.";
    } else if (trimmedCover.length > 1000) {
      next.coverLetter = "Сопроводительное сообщение не должно превышать 1000 символов.";
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
    <form
      noValidate
      onSubmit={handleSubmit}
      className="space-y-5 rounded-[28px] border border-black/5 bg-white p-6 shadow-sm md:p-8"
    >
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">Отправить отклик</h3>
        <p className="text-sm text-muted-foreground">
          Расскажите заказчику о своём предложении, цене и сроках.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="bid-price" className="text-sm font-medium">
            Цена, ₽
          </label>
          <input
            id="bid-price"
            type="number"
            inputMode="numeric"
            min={1}
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            placeholder="50000"
            className="h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none transition placeholder:text-zinc-400 focus:border-black"
          />
          {errors.price ? (
            <p className="text-xs text-red-600">{errors.price}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="bid-duration" className="text-sm font-medium">
            Срок, дней
          </label>
          <input
            id="bid-duration"
            type="number"
            inputMode="numeric"
            min={1}
            value={durationDays}
            onChange={(event) => setDurationDays(event.target.value)}
            placeholder="14"
            className="h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none transition placeholder:text-zinc-400 focus:border-black"
          />
          {errors.durationDays ? (
            <p className="text-xs text-red-600">{errors.durationDays}</p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="bid-cover" className="text-sm font-medium">
          Сопроводительное сообщение
        </label>
        <textarea
          id="bid-cover"
          rows={5}
          value={coverLetter}
          onChange={(event) => setCoverLetter(event.target.value)}
          placeholder="Расскажите про опыт, подход и почему стоит выбрать вас"
          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-zinc-400 focus:border-black"
        />
        {errors.coverLetter ? (
          <p className="text-xs text-red-600">{errors.coverLetter}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            {coverLetter.trim().length} / 1000
          </p>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-black px-6 text-sm text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Отправляем..." : "Отправить отклик"}
          {!isSubmitting ? <Send className="h-4 w-4" /> : null}
        </button>
      </div>
    </form>
  );
}
