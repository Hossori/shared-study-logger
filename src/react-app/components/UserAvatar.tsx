import { UserRound } from "lucide-react";
import { getAvatarUrl } from "../../../shared/schemas";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

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

  return (
    <Avatar className={cn(className)}>
      {url ? <AvatarImage src={url} alt={alt} /> : null}
      <AvatarFallback>
        <UserRound className="size-2/3" aria-hidden />
        <span className="sr-only">{alt || "デフォルトアバター"}</span>
      </AvatarFallback>
    </Avatar>
  );
}
