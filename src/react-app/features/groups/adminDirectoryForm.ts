/**
 * 管理者ディレクトリフォーム。HTTP 契約へ pipe する（trim は overlay 側）。
 */
import { z } from "zod";
import {
  AddGroupMemberRequestSchema,
  CreateAdminGroupRequestSchema,
  CreateAdminUserRequestSchema,
} from "@shared/schemas";

export const CreateAdminGroupFormSchema = z
  .object({
    name: z.string(),
  })
  .pipe(CreateAdminGroupRequestSchema);

export const CreateAdminUserFormSchema = z
  .object({
    email: z.string(),
    password: z.string(),
    displayName: z.string(),
  })
  .pipe(CreateAdminUserRequestSchema);

export const AddGroupMemberFormSchema = z
  .object({
    userId: z.string(),
  })
  .pipe(AddGroupMemberRequestSchema);
