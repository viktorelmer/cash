import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import { useUi } from "@/stores/useUi";
import { useT } from "@/i18n";
import { cn } from "@/lib/utils";

interface FloatingAddButtonProps {
  className?: string;
}

export function FloatingAddButton({ className }: FloatingAddButtonProps) {
  const t = useT();
  const open = useUi((s) => s.openAddExpense);

  return (
    <motion.button
      type="button"
      onClick={() => open()}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      whileTap={{ scale: 0.94 }}
      transition={{ type: "spring", stiffness: 380, damping: 26 }}
      className={cn(
        "fixed right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-pop tap",
        "bottom-[calc(env(safe-area-inset-bottom)+5rem)] sm:bottom-6 sm:right-6",
        className,
      )}
      aria-label={t("common.add_expense")}
    >
      <Plus className="h-6 w-6" strokeWidth={2.4} />
    </motion.button>
  );
}
