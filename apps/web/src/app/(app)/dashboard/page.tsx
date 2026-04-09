"use client";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { showErrorToast, showSuccessToast } from "@/lib/toast";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">Dashboard</h2>
        <p className="text-muted-foreground">
          Проверка компонента ConfirmDialog.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <ConfirmDialog
          trigger={<Button>Подтвердить завершение</Button>}
          title="Завершить проект?"
          description="После подтверждения проект перейдет в статус DONE."
          confirmText="Завершить"
          cancelText="Отмена"
          onConfirm={() => {
            showSuccessToast(
              "Проект завершён",
              "Статус проекта был успешно обновлён.",
            );
          }}
        />

        <ConfirmDialog
          trigger={<Button variant="destructive">Подтвердить отмену</Button>}
          title="Отменить проект?"
          description="Это действие нужно выполнять только если проект действительно не будет продолжен."
          confirmText="Отменить проект"
          cancelText="Назад"
          onConfirm={() => {
            showErrorToast(
              "Проект отменён",
              "Проект был переведён в статус CANCELED.",
            );
          }}
        />
      </div>
    </div>
  );
}
