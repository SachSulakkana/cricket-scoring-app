import { cn } from "@/lib/utils";

/** Side-profile cricket bat (filled), sized like lucide icons. */
export function CricketBatIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <path d="M11.4 2.1a1 1 0 0 0-.98.82L7.6 18.4a1.4 1.4 0 0 0 1.38 1.6h1.14a1.15 1.15 0 0 0 1.12-.92l.92-4.72 2.18 5.05a1.15 1.15 0 0 0 1.06.7h1.4a1.1 1.1 0 0 0 1.01-1.45L12.5 2.75a1 1 0 0 0-.92-.65h-.18z" />
    </svg>
  );
}
