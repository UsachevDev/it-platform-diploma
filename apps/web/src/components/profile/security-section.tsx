"use client";

import { useState } from "react";
import { ChevronDown, KeyRound, Mail } from "lucide-react";

import { ChangeEmailForm } from "@/components/profile/change-email-form";
import { ChangePasswordForm } from "@/components/profile/change-password-form";

type SecuritySectionProps = {
  currentEmail: string;
};

export function SecuritySection({ currentEmail }: SecuritySectionProps) {
  const [openPanel, setOpenPanel] = useState<"email" | "password" | null>(null);

  function toggle(panel: "email" | "password") {
    setOpenPanel((current) => (current === panel ? null : panel));
  }

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
        Безопасность
      </h2>

      <div className="overflow-hidden rounded-[28px] border border-black/5 bg-white shadow-sm">
        <SecurityRow
          icon={<Mail className="h-4 w-4" />}
          title="Смена email"
          description="Понадобится подтверждение текущим паролем"
          open={openPanel === "email"}
          onToggle={() => toggle("email")}
        >
          <ChangeEmailForm currentEmail={currentEmail} />
        </SecurityRow>

        <div className="border-t border-black/5" />

        <SecurityRow
          icon={<KeyRound className="h-4 w-4" />}
          title="Смена пароля"
          description="Введите текущий и новый пароль"
          open={openPanel === "password"}
          onToggle={() => toggle("password")}
        >
          <ChangePasswordForm />
        </SecurityRow>
      </div>
    </section>
  );
}

type SecurityRowProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
};

function SecurityRow({
  icon,
  title,
  description,
  open,
  onToggle,
  children,
}: SecurityRowProps) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left transition hover:bg-black/[0.02]"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700">
            {icon}
          </div>
          <div>
            <div className="text-sm font-semibold">{title}</div>
            <div className="text-xs text-muted-foreground">{description}</div>
          </div>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-zinc-400 transition ${open ? "rotate-180 text-foreground" : ""}`}
        />
      </button>

      {open ? <div className="border-t border-black/5 p-6">{children}</div> : null}
    </div>
  );
}
