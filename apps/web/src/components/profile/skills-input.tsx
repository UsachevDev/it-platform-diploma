"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";

import { getSkillsRequest } from "@/lib/api/skills";

const MAX_SKILLS = 30;
const MAX_SKILL_LENGTH = 50;
const MAX_VISIBLE_SUGGESTIONS = 6;

type SkillsInputProps = {
  value: string[];
  onChange: (next: string[]) => void;
  id?: string;
};

export function SkillsInput({ value, onChange, id }: SkillsInputProps) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: allSkills } = useQuery({
    queryKey: ["skills"],
    queryFn: getSkillsRequest,
    staleTime: 5 * 60_000,
  });

  const lowerSelected = useMemo(
    () => new Set(value.map((s) => s.toLowerCase())),
    [value],
  );

  const suggestions = useMemo(() => {
    const source = allSkills ?? [];
    const query = draft.trim().toLowerCase();
    if (!query) {
      return source
        .filter((s) => !lowerSelected.has(s.toLowerCase()))
        .slice(0, MAX_VISIBLE_SUGGESTIONS);
    }
    return source
      .filter(
        (s) =>
          s.toLowerCase().includes(query) &&
          !lowerSelected.has(s.toLowerCase()),
      )
      .slice(0, MAX_VISIBLE_SUGGESTIONS);
  }, [draft, lowerSelected, allSkills]);

  useEffect(() => {
    setActiveIndex(0);
  }, [draft, suggestions.length]);

  useEffect(() => {
    if (!open) return;

    function handlePointer(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointer);
    return () => document.removeEventListener("mousedown", handlePointer);
  }, [open]);

  function addSkill(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed) return;

    if (trimmed.length > MAX_SKILL_LENGTH) {
      setError(`Навык не длиннее ${MAX_SKILL_LENGTH} символов.`);
      return;
    }

    if (value.length >= MAX_SKILLS) {
      setError(`Максимум ${MAX_SKILLS} навыков.`);
      return;
    }

    if (lowerSelected.has(trimmed.toLowerCase())) {
      setError("Такой навык уже есть.");
      return;
    }

    onChange([...value, trimmed]);
    setDraft("");
    setError(null);
  }

  function removeSkill(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      if (suggestions.length > 0) {
        event.preventDefault();
        setOpen(true);
        setActiveIndex((index) => (index + 1) % suggestions.length);
      }
      return;
    }

    if (event.key === "ArrowUp") {
      if (suggestions.length > 0) {
        event.preventDefault();
        setOpen(true);
        setActiveIndex((index) =>
          index === 0 ? suggestions.length - 1 : index - 1,
        );
      }
      return;
    }

    if (event.key === "Escape") {
      setOpen(false);
      return;
    }

    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      if (open && suggestions[activeIndex]) {
        addSkill(suggestions[activeIndex]);
      } else {
        addSkill(draft);
      }
      return;
    }

    if (event.key === "Backspace" && draft === "" && value.length > 0) {
      removeSkill(value.length - 1);
    }
  }

  return (
    <div ref={containerRef} className="relative space-y-2">
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-black/10 bg-white p-2 transition focus-within:border-black">
        {value.map((skill, index) => (
          <span
            key={`${skill}-${index}`}
            className="inline-flex items-center gap-1 rounded-full bg-black/5 px-3 py-1 text-xs font-medium"
          >
            {skill}
            <button
              type="button"
              onClick={() => removeSkill(index)}
              aria-label={`Удалить навык ${skill}`}
              className="inline-flex h-4 w-4 items-center justify-center rounded-full text-zinc-500 transition hover:bg-black hover:text-white"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}

        <input
          id={id}
          type="text"
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            setError(null);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={
            value.length === 0
              ? "Добавьте навык и нажмите Enter"
              : "Ещё один навык?"
          }
          autoComplete="off"
          className="min-w-[140px] flex-1 bg-transparent px-2 py-1 text-sm outline-none placeholder:text-zinc-400"
        />
      </div>

      {open && suggestions.length > 0 ? (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-full z-40 mt-1 overflow-hidden rounded-2xl border border-black/10 bg-white p-1 shadow-lg"
        >
          {suggestions.map((suggestion, index) => {
            const active = index === activeIndex;
            return (
              <button
                key={suggestion}
                type="button"
                role="option"
                aria-selected={active}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseDown={(event) => {
                  event.preventDefault();
                  addSkill(suggestion);
                }}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${
                  active
                    ? "bg-black text-white"
                    : "text-foreground hover:bg-black/5"
                }`}
              >
                <span>{suggestion}</span>
                <span
                  className={`text-[10px] uppercase tracking-wide ${
                    active ? "text-white/70" : "text-muted-foreground"
                  }`}
                >
                  Enter
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      {error ? (
        <p className="text-xs text-red-600">{error}</p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Enter / запятая — добавить · Backspace — удалить последний · ↑↓ — выбор подсказки
          {value.length > 0 ? ` · ${value.length}/${MAX_SKILLS}` : ""}
        </p>
      )}
    </div>
  );
}
