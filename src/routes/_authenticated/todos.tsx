import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { LogOut, ListTodo } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { TodoForm, type NewTodo } from "@/components/todos/TodoForm";
import { TodoItem } from "@/components/todos/TodoItem";
import { createTodo, deleteTodo, listTodos, updateTodo } from "@/lib/todos.functions";
import type { Todo } from "@/lib/todos.schema";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/todos")({
  head: () => ({
    meta: [
      { title: "My tasks — Tasklet" },
      { name: "description", content: "Your private task list with priorities and due dates." },
      { property: "og:title", content: "My tasks — Tasklet" },
      {
        property: "og:description",
        content: "Your private task list with priorities and due dates.",
      },
    ],
  }),
  component: TodosPage,
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-md px-5 py-24 text-center">
      <h1 className="text-2xl">We couldn't load your tasks</h1>
      <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
    </div>
  ),
});

type Filter = "all" | "active" | "completed";

function errorMessage(error: unknown) {
  return error instanceof Error && error.message
    ? error.message
    : "Something went wrong. Please try again.";
}

function TodosPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

  const list = useServerFn(listTodos);
  const create = useServerFn(createTodo);
  const update = useServerFn(updateTodo);
  const remove = useServerFn(deleteTodo);

  const todosQuery = useQuery({
    queryKey: ["todos", filter, search],
    queryFn: () => list({ data: { filter, search } }),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["todos"] });

  const createMutation = useMutation({
    mutationFn: (todo: NewTodo) => create({ data: todo }),
    onSuccess: () => {
      invalidate();
      toast.success("Task added");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const updateMutation = useMutation({
    mutationFn: (patch: { id: string; title?: string; completed?: boolean }) =>
      update({ data: patch }),
    onSuccess: () => invalidate(),
    onError: (error) => toast.error(errorMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      invalidate();
      toast.success("Task deleted");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const todos = (todosQuery.data ?? []) as Todo[];
  const remaining = useMemo(() => todos.filter((t) => !t.completed).length, [todos]);
  const busy = updateMutation.isPending || deleteMutation.isPending;

  async function signOut() {
    await supabase.auth.signOut();
    queryClient.clear();
    navigate({ to: "/auth" });
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-4xl sm:text-5xl">My tasks</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {todosQuery.isLoading ? "Loading…" : `${remaining} open`}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={signOut}>
          <LogOut className="h-4 w-4" aria-hidden />
          Sign out
        </Button>
      </header>

      <div className="mt-8">
        <TodoForm
          pending={createMutation.isPending}
          onCreate={async (todo) => {
            await createMutation.mutateAsync(todo);
          }}
        />
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="completed">Done</TabsTrigger>
          </TabsList>
        </Tabs>
        <Input
          placeholder="Search tasks…"
          className="sm:max-w-56"
          value={search}
          maxLength={200}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search tasks"
        />
      </div>

      <section className="mt-4">
        {todosQuery.isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : todosQuery.isError ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
            <p className="text-sm text-destructive">{errorMessage(todosQuery.error)}</p>
            <Button className="mt-3" variant="outline" onClick={() => todosQuery.refetch()}>
              Try again
            </Button>
          </div>
        ) : todos.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center">
            <ListTodo className="mx-auto h-6 w-6 text-muted-foreground" aria-hidden />
            <p className="mt-3 text-sm text-muted-foreground">
              {search || filter !== "all" ? "No tasks match this view." : "Nothing here yet — add your first task."}
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {todos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                busy={busy}
                onToggle={(completed) => updateMutation.mutate({ id: todo.id, completed })}
                onRename={(title) => updateMutation.mutate({ id: todo.id, title })}
                onDelete={() => deleteMutation.mutate(todo.id)}
              />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
