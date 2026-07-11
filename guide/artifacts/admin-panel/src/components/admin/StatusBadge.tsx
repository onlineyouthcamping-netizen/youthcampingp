import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "destructive" | "outline";

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
  outline: "border border-border text-muted-foreground",
};

interface StatusBadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export function StatusBadge({ variant = "default", children, className }: StatusBadgeProps) {
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", variantClasses[variant], className)}>
      {children}
    </span>
  );
}

export function getBookingBadgeVariant(status: string): BadgeVariant {
  switch (status) {
    case "confirmed":
    case "accepted": return "success";
    case "pending": return "warning";
    case "cancelled":
    case "rejected": return "destructive";
    case "completed": return "default";
    default: return "default";
  }
}

export function getTripBadgeVariant(status: string): BadgeVariant {
  return status === "published" ? "success" : "outline";
}
