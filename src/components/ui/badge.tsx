import { cn } from "@/lib/utils";

interface BadgeProps {
  variant?: "default" | "success" | "warning" | "danger" | "info";
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = "default", children, className }: BadgeProps) {
  const variants = {
    default: "bg-gray-100 text-gray-700",
    success: "bg-green-100 text-green-700",
    warning: "bg-yellow-100 text-yellow-800",
    danger: "bg-red-100 text-red-700",
    info: "bg-blue-100 text-blue-700",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { variant: BadgeProps["variant"]; label: string }> = {
    AVAILABLE: { variant: "success", label: "Available" },
    REQUESTED: { variant: "warning", label: "Requested" },
    CHECKED_OUT: { variant: "info", label: "Checked Out" },
    PENDING: { variant: "warning", label: "Pending" },
    APPROVED: { variant: "success", label: "Approved" },
    DENIED: { variant: "danger", label: "Denied" },
    OVERDUE: { variant: "danger", label: "Overdue" },
  };

  const { variant, label } = config[status] || { variant: "default", label: status };
  return <Badge variant={variant}>{label}</Badge>;
}

export function RoleBadge({ role }: { role: string }) {
  const config: Record<string, BadgeProps["variant"]> = {
    ADMIN: "danger",
    LIBRARIAN: "info",
    MEMBER: "default",
  };

  return <Badge variant={config[role] || "default"}>{role}</Badge>;
}
