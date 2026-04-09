import { StatusBadge } from "@/components/common/status-badge";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">Dashboard</h2>
        <p className="text-muted-foreground">
          Проверка компонента StatusBadge.
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-medium">Статусы проектов</h3>
        <div className="flex flex-wrap gap-3">
          <StatusBadge status="OPEN" />
          <StatusBadge status="IN_WORK" />
          <StatusBadge status="DONE" />
          <StatusBadge status="CANCELED" />
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-medium">Статусы откликов</h3>
        <div className="flex flex-wrap gap-3">
          <StatusBadge status="PENDING" />
          <StatusBadge status="ACCEPTED" />
          <StatusBadge status="REJECTED" />
        </div>
      </div>
    </div>
  );
}
