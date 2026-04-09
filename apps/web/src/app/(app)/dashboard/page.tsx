import { FolderPlus, SearchX } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">Dashboard</h2>
        <p className="text-muted-foreground">Проверка компонента EmptyState.</p>
      </div>

      <EmptyState
        title="Проектов пока нет"
        description="Создай первый проект, чтобы начать работу с платформой."
        icon={<FolderPlus className="h-7 w-7 text-muted-foreground" />}
        action={<Button>Создать проект</Button>}
      />

      <EmptyState
        title="Ничего не найдено"
        description="Попробуй изменить фильтры или очистить параметры поиска."
        icon={<SearchX className="h-7 w-7 text-muted-foreground" />}
      />
    </div>
  );
}
