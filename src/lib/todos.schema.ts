import { z } from "zod";

/** Shared validation contract — used by both the client forms and the server functions. */

export const PRIORITIES = ["low", "medium", "high"] as const;
export const prioritySchema = z.enum(PRIORITIES);
export type Priority = z.infer<typeof prioritySchema>;

const titleSchema = z
  .string({ required_error: "Title is required" })
  .transform((value) => value.trim())
  .pipe(
    z
      .string()
      .min(1, "Title is required")
      .max(200, "Title must be 200 characters or fewer"),
  );

const notesSchema = z
  .string()
  .max(2000, "Notes must be 2000 characters or fewer")
  .transform((value) => (value.trim() === "" ? null : value.trim()))
  .nullable()
  .optional();

const dueDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Due date must be a valid date")
  .refine((value) => !Number.isNaN(Date.parse(value)), "Due date must be a valid date")
  .nullable()
  .optional()
  .transform((value) => (value === "" || value === undefined ? null : value));

export const createTodoSchema = z.object({
  title: titleSchema,
  notes: notesSchema,
  priority: prioritySchema.default("medium"),
  dueDate: z.union([dueDateSchema, z.literal("")]).transform((v) => (v ? v : null)),
});
export type CreateTodoInput = z.input<typeof createTodoSchema>;

export const updateTodoSchema = z.object({
  id: z.string().uuid("Invalid todo id"),
  title: titleSchema.optional(),
  notes: notesSchema,
  priority: prioritySchema.optional(),
  dueDate: z.union([dueDateSchema, z.literal("")]).optional().transform((v) => (v ? v : null)),
  completed: z.boolean().optional(),
});

export const deleteTodoSchema = z.object({ id: z.string().uuid("Invalid todo id") });

export const listTodosSchema = z.object({
  filter: z.enum(["all", "active", "completed"]).default("all"),
  search: z.string().max(200).default(""),
});

export type Todo = {
  id: string;
  title: string;
  notes: string | null;
  priority: Priority;
  due_date: string | null;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

/** Turns a Zod error into a `{ field: message }` map for form rendering. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
