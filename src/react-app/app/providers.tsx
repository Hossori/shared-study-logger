import type { ReactNode } from "react";
import { ConfirmProvider } from "@/components/ConfirmProvider";

export function AppProviders({ children }: { children: ReactNode }) {
  return <ConfirmProvider>{children}</ConfirmProvider>;
}
