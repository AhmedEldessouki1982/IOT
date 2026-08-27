import type { ReactNode } from "react";

interface DemoBadgeProps {
  variant?: "preview" | "demo" | "live";
  children?: ReactNode;
  className?: string;
}

export default function DemoBadge({ variant = "demo", children, className = "" }: DemoBadgeProps) {
  const labels: Record<string, string> = {
    preview: "Preview",
    demo: "Demo Data",
    live: "Live",
  };
  return (
    <span className={`cc-badge cc-badge--${variant} ${className}`.trim()} data-variant={variant}>
      {children ?? labels[variant]}
    </span>
  );
}
