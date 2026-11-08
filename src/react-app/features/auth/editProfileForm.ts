/**
 * プロフィール編集フォーム。trim と空 bio → null はここで行い、HTTP 契約へ pipe する。
 */
import { z } from "zod";
import { AvatarKeySchema, UpdateProfileRequestSchema } from "@shared/schemas";

export const EditProfileFormSchema = z
  .object({
    displayName: z.string().trim().min(1, "表示名を入力してください。"),
    bio: z.string().transform((value) => {
      const trimmed = value.trim();
      return trimmed === "" ? null : trimmed;
    }),
    avatarKey: z.union([AvatarKeySchema, z.null()]),
  })
  .pipe(UpdateProfileRequestSchema);
