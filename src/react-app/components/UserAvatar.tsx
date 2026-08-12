import { UserRound } from "lucide-react";
import { getAvatarUrl } from "../../../shared/schemas";
import { cn } from "../lib/cn";

interface UserAvatarProps {
  avatarKey: string | null | undefined;
  className?: string;
  alt?: string;
}

export default function UserAvatar({
  avatarKey,
  className,
  alt = "",
}: UserAvatarProps) {
  const url = getAvatarUrl(avatarKey);

  if (url) {
    return (
      <img
        src={url}
        alt={alt}
        className={cn(
          "rounded-full object-cover ring-1 ring-gray-200",
          className,
        )}
      />
    );
  }

  return (
    <span
      role="img"
      aria-label={alt || "デフォルトアバター"}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-gray-100 ring-1 ring-gray-200",
        className,
      )}
    >
      <UserRound className="size-[55%] text-gray-400" aria-hidden />
    </span>
  );
}
