export function buildBlockMessage(
  reason: string | null,
  blockedUntil: Date | null,
): string {
  const term = blockedUntil
    ? `до ${blockedUntil.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })}`
    : 'бессрочно';

  const reasonPart = reason ? `. Причина: ${reason}` : '';

  return `Аккаунт заблокирован ${term}${reasonPart}`;
}
