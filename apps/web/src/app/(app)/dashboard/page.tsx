"use client";

import { Button } from "@/components/ui/button";
import { showErrorToast, showInfoToast, showSuccessToast } from "@/lib/toast";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">Dashboard</h2>
        <p className="text-muted-foreground">Проверка toast-уведомлений.</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() =>
            showSuccessToast(
              "Проект создан",
              "Новый проект успешно добавлен в систему.",
            )
          }
        >
          Success toast
        </Button>

        <Button
          variant="destructive"
          onClick={() =>
            showErrorToast(
              "Ошибка сохранения",
              "Не удалось выполнить запрос. Попробуй снова.",
            )
          }
        >
          Error toast
        </Button>

        <Button
          variant="outline"
          onClick={() =>
            showInfoToast(
              "Информация",
              "Это базовое уведомление для пользовательских действий.",
            )
          }
        >
          Info toast
        </Button>
      </div>
    </div>
  );
}
