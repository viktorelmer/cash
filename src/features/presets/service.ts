import { db } from "@/lib/db";
import type { ExpensePreset } from "@/types";
import { uid } from "@/lib/utils";

export type PresetDraft = Omit<ExpensePreset, "id" | "createdAt"> & {
  id?: string;
};

export async function createPreset(draft: PresetDraft): Promise<ExpensePreset> {
  const preset: ExpensePreset = {
    id: draft.id ?? uid("preset"),
    name: draft.name.trim() || "Quick",
    amount: Number(draft.amount),
    currency: draft.currency,
    categoryId: draft.categoryId,
    subcategoryId: draft.subcategoryId ?? null,
    icon: draft.icon || "Zap",
    color: draft.color,
    note: draft.note ?? "",
    createdAt: Date.now(),
  };
  await db.presets.put(preset);
  return preset;
}

export async function deletePreset(id: string): Promise<void> {
  await db.presets.delete(id);
}
