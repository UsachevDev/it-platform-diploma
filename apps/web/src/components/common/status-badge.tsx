import { Badge } from "@/components/ui/badge";

type ProjectStatus = "OPEN" | "IN_WORK" | "DONE" | "CANCELED";
type BidStatus = "PENDING" | "ACCEPTED" | "REJECTED";

type StatusBadgeProps = {
  status: ProjectStatus | BidStatus;
};

const statusMap: Record<
  ProjectStatus | BidStatus,
  {
    label: string;
    className: string;
  }
> = {
  OPEN: {
    label: "Открыт",
    className: "border-blue-200 bg-blue-100 text-blue-700 hover:bg-blue-100",
  },
  IN_WORK: {
    label: "В работе",
    className:
      "border-amber-200 bg-amber-100 text-amber-700 hover:bg-amber-100",
  },
  DONE: {
    label: "Завершён",
    className:
      "border-green-200 bg-green-100 text-green-700 hover:bg-green-100",
  },
  CANCELED: {
    label: "Отменён",
    className: "border-zinc-200 bg-zinc-100 text-zinc-700 hover:bg-zinc-100",
  },
  PENDING: {
    label: "На рассмотрении",
    className:
      "border-purple-200 bg-purple-100 text-purple-700 hover:bg-purple-100",
  },
  ACCEPTED: {
    label: "Принят",
    className:
      "border-green-200 bg-green-100 text-green-700 hover:bg-green-100",
  },
  REJECTED: {
    label: "Отклонён",
    className: "border-red-200 bg-red-100 text-red-700 hover:bg-red-100",
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusMap[status];

  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
