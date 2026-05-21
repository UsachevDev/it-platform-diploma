"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export type SelectMenuOption<T extends string> = {
  value: T;
  label: string;
};

type SelectMenuProps<T extends string> = {
  value: T;
  options: ReadonlyArray<SelectMenuOption<T>>;
  onChange: (value: T) => void;
  className?: string;
  ariaLabel?: string;
};

export function SelectMenu<T extends string>({
  value,
  options,
  onChange,
  className,
  ariaLabel,
}: SelectMenuProps<T>) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const current = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKey);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-full border border-black/10 bg-white pl-4 pr-3 text-sm outline-none transition hover:border-black/20 focus:border-black"
      >
        <span className="truncate">{current?.label ?? "—"}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-zinc-400 transition",
            open && "rotate-180 text-foreground",
          )}
        />
      </button>

      {open ? (
        <div
          role="listbox"
          className="absolute right-0 z-40 mt-2 min-w-full overflow-hidden rounded-2xl border border-black/10 bg-white p-1 shadow-lg"
        >
          {options.map((option) => {
            const selected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between gap-3 whitespace-nowrap rounded-xl px-3 py-2 text-left text-sm transition",
                  selected
                    ? "bg-black text-white"
                    : "text-foreground hover:bg-black/5",
                )}
              >
                <span>{option.label}</span>
                {selected ? <Check className="h-4 w-4 shrink-0" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
