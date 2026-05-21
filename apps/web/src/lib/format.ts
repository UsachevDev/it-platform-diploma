export function formatBudgetRange(
  min: number | null | undefined,
  max: number | null | undefined,
): string {
  if (min == null && max == null) {
    return "Бюджет не указан";
  }

  if (min != null && max != null) {
    if (min === max) {
      return `${formatRubles(min)}`;
    }
    return `${formatRubles(min)} – ${formatRubles(max)}`;
  }

  if (min != null) {
    return `от ${formatRubles(min)}`;
  }

  return `до ${formatRubles(max!)}`;
}

export function formatRubles(value: number): string {
  return `${new Intl.NumberFormat("ru-RU").format(value)} ₽`;
}

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

export function formatDate(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return dateFormatter.format(date);
}

const dateTimeFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDateTime(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return dateTimeFormatter.format(date);
}
