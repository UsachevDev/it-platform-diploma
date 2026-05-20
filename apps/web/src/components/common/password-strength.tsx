type PasswordStrengthProps = {
  password: string;
};

type Strength = {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  color: string;
};

function evaluate(password: string): Strength {
  if (!password) {
    return { score: 0, label: "", color: "" };
  }

  let points = 0;
  if (password.length >= 6) points += 1;
  if (password.length >= 10) points += 1;
  if (/[a-zа-я]/i.test(password) && /[0-9]/.test(password)) points += 1;
  if (/[^a-zа-я0-9]/i.test(password)) points += 1;

  if (password.length < 6) {
    return { score: 1, label: "Слишком короткий", color: "bg-red-500" };
  }

  const map: Record<number, Strength> = {
    1: { score: 1, label: "Слабый", color: "bg-red-500" },
    2: { score: 2, label: "Средний", color: "bg-amber-500" },
    3: { score: 3, label: "Хороший", color: "bg-lime-500" },
    4: { score: 4, label: "Надёжный", color: "bg-emerald-600" },
  };

  return map[Math.max(1, points)] ?? map[1];
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  if (!password) return null;

  const strength = evaluate(password);

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((segment) => (
          <div
            key={segment}
            className={`h-1.5 flex-1 rounded-full transition ${
              segment <= strength.score ? strength.color : "bg-black/10"
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Надёжность пароля:{" "}
        <span className="font-medium text-foreground">{strength.label}</span>
      </p>
    </div>
  );
}
