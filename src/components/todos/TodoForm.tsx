import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createTodoSchema, fieldErrors, PRIORITIES, type Priority } from "@/lib/todos.schema";

export type NewTodo = {
  title: string;
  notes: string | null;
  priority: Priority;
  dueDate: string | null;
};

export function TodoForm({
  onCreate,
  pending,
}: {
  onCreate: (todo: NewTodo) => Promise<void>;
  pending: boolean;
}) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = createTodoSchema.safeParse({ title, notes, priority, dueDate });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    await onCreate({
      title: parsed.data.title,
      notes: parsed.data.notes ?? null,
      priority: parsed.data.priority,
      dueDate: parsed.data.dueDate,
    });
    setTitle("");
    setNotes("");
    setPriority("medium");
    setDueDate("");
    setExpanded(false);
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)] sm:p-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <Label htmlFor="new-title" className="sr-only">
            What needs doing?
          </Label>
          <Input
            id="new-title"
            placeholder="What needs doing?"
            value={title}
            maxLength={200}
            onFocus={() => setExpanded(true)}
            onChange={(e) => setTitle(e.target.value)}
            aria-invalid={Boolean(errors["title"])}
          />
          {errors["title"] && <p className="mt-1 text-sm text-destructive">{errors["title"]}</p>}
        </div>
        <Button type="submit" disabled={pending} className="sm:w-auto">
          <Plus className="h-4 w-4" aria-hidden />
          Add task
        </Button>
      </div>

      {expanded && (
        <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto_auto]">
          <div>
            <Label htmlFor="new-notes" className="text-xs text-muted-foreground">
              Notes (optional)
            </Label>
            <Textarea
              id="new-notes"
              rows={2}
              maxLength={2000}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              aria-invalid={Boolean(errors["notes"])}
            />
            {errors["notes"] && <p className="mt-1 text-sm text-destructive">{errors["notes"]}</p>}
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Priority</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
              <SelectTrigger className="mt-1 w-full sm:w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p} value={p} className="capitalize">
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="new-due" className="text-xs text-muted-foreground">
              Due date
            </Label>
            <Input
              id="new-due"
              type="date"
              className="mt-1 w-full sm:w-44"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              aria-invalid={Boolean(errors["dueDate"])}
            />
            {errors["dueDate"] && (
              <p className="mt-1 text-sm text-destructive">{errors["dueDate"]}</p>
            )}
          </div>
        </div>
      )}
    </form>
  );
}
