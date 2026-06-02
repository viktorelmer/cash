import { db } from "@/lib/db";
import type { Category } from "@/types";
import { uid } from "@/lib/utils";

export type CategoryDraft = Omit<Category, "id" | "createdAt" | "isDefault"> & {
  id?: string;
  isDefault?: boolean;
};

export async function createCategory(draft: CategoryDraft): Promise<Category> {
  const now = Date.now();
  const category: Category = {
    id: draft.id ?? uid("cat"),
    name: draft.name.trim() || "Untitled",
    icon: draft.icon || "Tag",
    color: draft.color || "#71717A",
    parentId: draft.parentId ?? null,
    isDefault: !!draft.isDefault,
    createdAt: now,
    archivedAt: null,
  };
  await db.categories.put(category);
  return category;
}

export async function updateCategory(
  id: string,
  patch: Partial<Category>,
): Promise<void> {
  await db.categories.update(id, patch);
}

export async function archiveCategory(id: string): Promise<void> {
  await db.categories.update(id, { archivedAt: Date.now() });
}

export async function restoreCategory(id: string): Promise<void> {
  await db.categories.update(id, { archivedAt: null });
}

export async function deleteCategory(id: string): Promise<void> {
  // Re-parent children before deletion
  const children = await db.categories.where("parentId").equals(id).toArray();
  if (children.length > 0) {
    await db.categories.bulkUpdate(
      children.map((c) => ({ key: c.id, changes: { parentId: null } })),
    );
  }
  await db.categories.delete(id);
}
