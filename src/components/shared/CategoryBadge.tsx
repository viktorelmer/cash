import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import type { Category } from "@/types";

interface CategoryBadgeProps {
  category?: Category | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: { box: "h-8 w-8 rounded-lg", icon: "h-4 w-4" },
  md: { box: "h-10 w-10 rounded-xl", icon: "h-5 w-5" },
  lg: { box: "h-12 w-12 rounded-2xl", icon: "h-6 w-6" },
};

export function CategoryBadge({
  category,
  size = "md",
  className,
}: CategoryBadgeProps) {
  const { box, icon } = sizeMap[size];
  const color = category?.color ?? "#71717A";
  const name = category?.icon ?? "Tag";
  return (
    <div
      className={cn(
        "flex items-center justify-center shrink-0 ring-1 ring-inset ring-black/[0.03]",
        box,
        className,
      )}
      style={{ backgroundColor: `${color}26`, color }}
      aria-hidden
    >
      <Icon name={name} className={cn(icon)} strokeWidth={2} />
    </div>
  );
}
