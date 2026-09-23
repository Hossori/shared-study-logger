import { LoginForm } from "@/features/auth";
import ThemeToggle from "@/app/shell/ThemeToggle";

export default function LoginPage() {
  return (
    <div className="bg-background flex min-h-dvh items-center justify-center pt-[max(1rem,var(--safe-area-inset-top))] pr-[max(1rem,var(--safe-area-inset-right))] pb-[max(1rem,var(--safe-area-inset-bottom))] pl-[max(1rem,var(--safe-area-inset-left))]">
      <div className="fixed top-[max(0.75rem,var(--safe-area-inset-top))] right-[max(0.75rem,var(--safe-area-inset-right))] z-20">
        <ThemeToggle />
      </div>
      <LoginForm />
    </div>
  );
}
