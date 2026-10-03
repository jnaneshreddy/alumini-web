"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

export function AdminNavigateButton({
  href,
  children,
  className,
  variant = "outline",
}: {
  href: string;
  children: ReactNode;
  className?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
}) {
  const router = useRouter();
  return (
    <Button
      type="button"
      variant={variant}
      className={className}
      onClick={() => router.push(href)}
    >
      {children}
    </Button>
  );
}

