/**
 * HTTP 境界の検証。パス ID と、返す直前の成功 JSON。
 * 失敗した成功ボディは送らない。
 */
import type { Context } from "hono";
import type { z } from "zod";
import { ResourceIdSchema } from "@shared/schemas";

export function parseResourceId(value: string | undefined): string | null {
  const parsed = ResourceIdSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function jsonParsed<T>(
  c: Context,
  schema: z.ZodType<T>,
  body: unknown,
  status: 200 | 201 = 200,
) {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    console.error("invalid_response", parsed.error.issues);
    return c.json({ error: "invalid_response" }, 500);
  }
  return c.json(parsed.data, status);
}
