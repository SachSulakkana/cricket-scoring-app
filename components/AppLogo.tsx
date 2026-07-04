import Image from "next/image";
import { APP_LOGO_SRC, APP_NAME } from "@/lib/app-brand";
import { cn } from "@/lib/utils";

export default function AppLogo({
  className,
  size = 48,
  priority = false,
}: {
  className?: string;
  size?: number;
  priority?: boolean;
}) {
  return (
    <Image
      src={APP_LOGO_SRC}
      alt={`${APP_NAME} logo`}
      width={size}
      height={size}
      className={cn("shrink-0 object-contain", className)}
      priority={priority}
    />
  );
}
