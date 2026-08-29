import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

import {
  createTodoSchema,
  deleteTodoSchema,
  listTodosSchema,
  updateTodoSchema,
  type Todo,
} from "./todos.schema";

class ApiError extends Error {}

function fail(message: string): never {
  throw new ApiError(message);
}

export const listTodos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => listTodosSchema.parse(input ?? {}))
  .handler(async ({ data, context }): Promise<Todo[]> => {
    let query = context.supabase
      .from("todos")
      .select("*")
      .eq("user_id", context.userId)
      .order("completed", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(500);

    if (data.filter === "active") query = query.eq("completed", false);
    if (data.filter === "completed") query = query.eq("completed", true);
    if (data.search.trim()) query = query.ilike("title", `%${data.search.trim()}%`);

    const { data: rows, error } = await query;
    if (error) fail("Could not load your todos. Please try again.");
    return (rows ?? []) as Todo[];
  });

export const createTodo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => createTodoSchema.parse(input))
  .handler(async ({ data, context }): Promise<Todo> => {
    const { data: row, error } = await context.supabase
      .from("todos")
      .insert({
        user_id: context.userId,
        title: data.title,
        notes: data.notes ?? null,
        priority: data.priority,
        due_date: data.dueDate,
      })
      .select("*")
      .single();
    if (error || !row) fail("Could not create the todo. Please try again.");
    return row as Todo;
  });

export const updateTodo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => updateTodoSchema.parse(input))
  .handler(async ({ data, context }): Promise<Todo> => {
    const patch: Record<string, unknown> = {};
    if (data.title !== undefined) patch["title"] = data.title;
    if (data.notes !== undefined) patch["notes"] = data.notes;
    if (data.priority !== undefined) patch["priority"] = data.priority;
    if (data.dueDate !== undefined) patch["due_date"] = data.dueDate;
    if (data.completed !== undefined) patch["completed"] = data.completed;
    if (Object.keys(patch).length === 0) fail("Nothing to update.");

    const { data: row, error } = await context.supabase
      .from("todos")
      .update(patch)
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .select("*")
      .maybeSingle();
    if (error) fail("Could not save your changes. Please try again.");
    if (!row) fail("That todo no longer exists.");
    return row as Todo;
  });

export const deleteTodo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => deleteTodoSchema.parse(input))
  .handler(async ({ data, context }): Promise<{ id: string }> => {
    const { error } = await context.supabase
      .from("todos")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) fail("Could not delete the todo. Please try again.");
    return { id: data.id };
  });
