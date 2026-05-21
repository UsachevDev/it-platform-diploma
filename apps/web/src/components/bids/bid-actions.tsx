"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2 } from "lucide-react";

import { EditBidDialog } from "@/components/bids/edit-bid-dialog";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { type Bid, deleteBidRequest } from "@/lib/api/bids";
import { getApiErrorMessage } from "@/lib/api/errors";
import { showErrorToast, showSuccessToast } from "@/lib/toast";

type BidActionsProps = {
  bid: Bid;
  /** Размер кнопок: "sm" для мест с плотным интерфейсом */
  size?: "sm" | "md";
};

export function BidActions({ bid, size = "md" }: BidActionsProps) {
  const [editOpen, setEditOpen] = useState(false);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => deleteBidRequest(bid.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bids", "my"] });
      queryClient.invalidateQueries({
        queryKey: ["bids", "project", bid.projectId],
      });
      queryClient.invalidateQueries({ queryKey: ["project", bid.projectId] });
      showSuccessToast("Отклик удалён");
    },
    onError: (error) => {
      showErrorToast(getApiErrorMessage(error, "Не удалось удалить отклик"));
    },
  });

  const projectStatus = bid.project?.status ?? "OPEN";
  const canEdit = bid.status === "PENDING" && projectStatus === "OPEN";
  const canDelete = !(bid.status === "ACCEPTED" && projectStatus === "IN_WORK");

  if (!canEdit && !canDelete) return null;

  const buttonHeight = size === "sm" ? "h-8" : "h-9";
  const buttonPadding = size === "sm" ? "px-3" : "px-4";
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <div className="flex flex-wrap gap-2">
      {canEdit ? (
        <button
          type="button"
          onClick={() => setEditOpen(true)}
          disabled={deleteMutation.isPending}
          className={`inline-flex ${buttonHeight} items-center gap-2 rounded-full border border-black/10 bg-white ${buttonPadding} text-sm transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-60`}
        >
          <Pencil className={iconSize} />
          Изменить
        </button>
      ) : null}

      {canDelete ? (
        <ConfirmDialog
          title="Удалить отклик?"
          description="Отклик будет удалён без возможности восстановления."
          confirmText="Удалить"
          cancelText="Назад"
          onConfirm={() => deleteMutation.mutate()}
          trigger={
            <button
              type="button"
              disabled={deleteMutation.isPending}
              className={`inline-flex ${buttonHeight} items-center gap-2 rounded-full border border-black/10 bg-white ${buttonPadding} text-sm transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <Trash2 className={iconSize} />
              Удалить
            </button>
          }
        />
      ) : null}

      {canEdit ? (
        <EditBidDialog bid={bid} open={editOpen} onOpenChange={setEditOpen} />
      ) : null}
    </div>
  );
}
