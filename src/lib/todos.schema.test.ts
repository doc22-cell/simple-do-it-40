import { describe, expect, it } from "vitest";

import {
  createTodoSchema,
  deleteTodoSchema,
  fieldErrors,
  listTodosSchema,
  updateTodoSchema,
} from "./todos.schema";

describe("createTodoSchema", () => {
  it("trims the title and defaults priority", () => {
    const result = createTodoSchema.parse({ title: "  Buy milk  ", dueDate: "" });
    expect(result.title).toBe("Buy milk");
    expect(result.priority).toBe("medium");
    expect(result.dueDate).toBeNull();
  });

  it("rejects an empty or whitespace-only title", () => {
    const result = createTodoSchema.safeParse({ title: "   " });
    expect(result.success).toBe(false);
    if (!result.success) expect(fieldErrors(result.error)["title"]).toMatch(/required/i);
  });

  it("rejects a title over 200 characters", () => {
    expect(createTodoSchema.safeParse({ title: "x".repeat(201) }).success).toBe(false);
  });

  it("rejects notes over 2000 characters", () => {
    expect(
      createTodoSchema.safeParse({ title: "ok", notes: "n".repeat(2001) }).success,
    ).toBe(false);
  });

  it("normalises blank notes to null", () => {
    expect(createTodoSchema.parse({ title: "ok", notes: "  " }).notes).toBeNull();
  });

  it("rejects a malformed due date", () => {
    expect(createTodoSchema.safeParse({ title: "ok", dueDate: "31-12-2026" }).success).toBe(false);
    expect(createTodoSchema.parse({ title: "ok", dueDate: "2026-12-31" }).dueDate).toBe("2026-12-31");
  });

  it("rejects an unknown priority", () => {
    expect(createTodoSchema.safeParse({ title: "ok", priority: "urgent" }).success).toBe(false);
  });
});

describe("updateTodoSchema", () => {
  it("requires a uuid id", () => {
    expect(updateTodoSchema.safeParse({ id: "123", title: "x" }).success).toBe(false);
  });

  it("accepts a partial patch", () => {
    const parsed = updateTodoSchema.parse({
      id: "3f4f1f7a-2c53-4f0f-9f6a-9d4e5a6b7c8d",
      completed: true,
    });
    expect(parsed.completed).toBe(true);
    expect(parsed.title).toBeUndefined();
  });
});

describe("deleteTodoSchema / listTodosSchema", () => {
  it("validates delete input", () => {
    expect(deleteTodoSchema.safeParse({ id: "nope" }).success).toBe(false);
  });

  it("defaults list filters", () => {
    expect(listTodosSchema.parse({})).toEqual({ filter: "all", search: "" });
  });

  it("rejects an unknown filter", () => {
    expect(listTodosSchema.safeParse({ filter: "archived" }).success).toBe(false);
  });
});
