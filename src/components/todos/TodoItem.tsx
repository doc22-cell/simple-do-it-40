import { useState } from "react";
import { CalendarDays, Check, Pencil, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Todo } from "@/lib/todos.schema";

const PRIORITY_STYLES: Record<Todo["priority"], string> = {
  low: "border-border bg-muted text-muted-foreground",
  medium: "border-primary/30 bg-primary/10 text-primary",
  high: "border-accent/50 bg-accent/20 text-accent-foreground",
};

function isOverdue(todo: Todo) {
  if (!todo.due_date || todo.completed) return false;
  return todo.due_date < new Date().toISOString().slice(0, 10);
}

export function TodoItem({
  todo,
  onToggle,
  onRename,
  onDelete,
  busy,
}: {
  todo: Todo;
  onToggle: (completed: boolean) => void;
  onRename: (title: string) => void;
  onDelete: () => void;
  busy: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(todo.title);
  const [error, setError] = useState<string | null>(null);

  function commit() {
    const trimmed = draft.trim();
    if (trimmed.length < 1 || trimmed.length > 200) {
      setError("Title must be between 1 and 200 characters");
      return;
    }
    setError(null);
    setEditing(false);
    if (trimmed !== todo.title) onRename(trimmed);
  }

  return (
    <li
      className={cn(
        "group flex flex-col gap-2 rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)] transition-opacity sm:flex-row sm:items-start sm:gap-4",
        todo.completed && "opacity-60",
      )}
    >
      <Checkbox
        checked={todo.completed}
        disabled={busy}
        onCheckedChange={(v) => onToggle(Boolean(v))}
        aria-label={todo.completed ? `Mark ${todo.title} as active` : `Complete ${todo.title}`}
        className="mt-1"
      />

      <div className="min-w-0 flex-1">
        {editing ? (
          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={draft}
              autoFocus
              maxLength={200}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commit();
                if (e.key === "Escape") {
                  setDraft(todo.title);
                  setEditing(false);
                  setError(null);
                }
              }}
              className="flex-1"
            />
            <Button size="icon" variant="ghost" onClick={commit} aria-label="Save title">
              <Check className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              aria-label="Cancel editing"
              onClick={() => {
                setDraft(todo.title);
                setEditing(false);
                setError(null);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <p className={cn("break-words font-medium", todo.completed && "line-through")}>
            {todo.title}
          </p>
        )}
        {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
        {todo.notes && (
          <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{todo.notes}</p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={cn("capitalize", PRIORITY_STYLES[todo.priority])}>
            {todo.priority}
          </Badge>
          {todo.due_date && (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-xs text-muted-foreground",
                isOverdue(todo) && "font-medium text-destructive",
              )}
            >
              <CalendarDays className="h-3.5 w-3.5" aria-hidden />
              {todo.due_date}
              {isOverdue(todo) && " · overdue"}
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-1 self-end sm:self-start">
        {!editing && (
          <Button
            size="icon"
            variant="ghost"
            disabled={busy}
            onClick={() => setEditing(true)}
            aria-label={`Edit ${todo.title}`}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        )}
        <Button
          size="icon"
          variant="ghost"
          disabled={busy}
          onClick={onDelete}
          aria-label={`Delete ${todo.title}`}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </li>
  );
}
