import { Link } from "react-router-dom";
import { ChevronRight, type LucideIcon } from "lucide-react";

interface NavRowProps {
  to: string;
  icon: LucideIcon;
  title: string;
  description: string;
}

export function NavRow({ to, icon: Icon, title, description }: NavRowProps) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-xl p-3 tap hover:bg-secondary/50"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">{title}</div>
        <div className="truncate text-xs text-muted-foreground">
          {description}
        </div>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}
