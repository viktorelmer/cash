import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import { cn } from "@/lib/utils";

interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
  maxHeight?: string;
  dismissible?: boolean;
}

export function BottomSheet({
  open,
  onOpenChange,
  children,
  title,
  description,
  className,
  maxHeight = "92vh",
  dismissible = true,
}: BottomSheetProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild>
              <motion.div
                key="sheet-overlay"
                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
              />
            </DialogPrimitive.Overlay>
            <DialogPrimitive.Content
              asChild
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <motion.div
                key="sheet-content"
                className={cn(
                  "fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-3xl border-t border-x border-border bg-elevated shadow-pop pb-safe",
                  className,
                )}
                style={{ maxHeight }}
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{
                  type: "spring",
                  stiffness: 380,
                  damping: 38,
                  mass: 0.9,
                }}
                drag={dismissible ? "y" : false}
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 0.4 }}
                onDragEnd={(_e, info: PanInfo) => {
                  if (info.offset.y > 120 || info.velocity.y > 500) {
                    onOpenChange(false);
                  }
                }}
              >
                <div className="flex justify-center pt-2.5 pb-1.5">
                  <div className="h-1.5 w-10 rounded-full bg-subtle" />
                </div>
                {(title || description) && (
                  <div className="px-5 pb-2 pt-1">
                    {title && (
                      <DialogPrimitive.Title className="text-base font-semibold tracking-tight">
                        {title}
                      </DialogPrimitive.Title>
                    )}
                    {description && (
                      <DialogPrimitive.Description className="mt-1 text-sm text-muted-foreground">
                        {description}
                      </DialogPrimitive.Description>
                    )}
                  </div>
                )}
                <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-4 pt-1">
                  {children}
                </div>
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
}
