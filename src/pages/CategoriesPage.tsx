import { useMemo, useState } from "react";
import { Archive, ChevronDown, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Icon, ICON_NAMES } from "@/components/ui/icon";
import { useAllCategories } from "@/hooks/useData";
import {
  archiveCategory,
  createCategory,
  deleteCategory,
  restoreCategory,
  updateCategory,
} from "@/features/categories/service";
import type { Category } from "@/types";
import { useT } from "@/i18n";
import { useCategoryName } from "@/i18n/categories";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const ICONS = ICON_NAMES;

const COLORS = [
  "#F59E0B",
  "#F97316",
  "#EF4444",
  "#EC4899",
  "#8B5CF6",
  "#6366F1",
  "#3B82F6",
  "#06B6D4",
  "#10B981",
  "#22C55E",
  "#84CC16",
  "#71717A",
];

export function CategoriesPage() {
  const t = useT();
  const categoryName = useCategoryName();
  const all = useAllCategories();
  const [editing, setEditing] = useState<Category | null>(null);
  const [creatingParentId, setCreatingParentId] = useState<
    string | null | "__new__"
  >(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const tree = useMemo(() => {
    const top = all
      .filter((c) => c.parentId === null && !c.archivedAt)
      .sort((a, b) => categoryName(a).localeCompare(categoryName(b)));
    return top.map((parent) => ({
      ...parent,
      children: all
        .filter((c) => c.parentId === parent.id && !c.archivedAt)
        .sort((a, b) => categoryName(a).localeCompare(categoryName(b))),
    }));
  }, [all, categoryName]);

  const archived = useMemo(
    () =>
      all
        .filter((c) => !!c.archivedAt)
        .sort((a, b) => categoryName(a).localeCompare(categoryName(b))),
    [all, categoryName],
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title={t("categories.title")}
        description={t("categories.description")}
        action={
          <Button size="sm" onClick={() => setCreatingParentId("__new__")}>
            <Plus className="h-4 w-4" />
            {t("categories.new_button")}
          </Button>
        }
      />

      <Card>
        <CardContent className="p-2">
          <ul className="divide-y divide-border">
            {tree.map((c) => {
              const open = expanded[c.id];
              return (
                <li key={c.id}>
                  <div className="flex items-center gap-2 p-2">
                    <button
                      type="button"
                      onClick={() =>
                        setExpanded((s) => ({ ...s, [c.id]: !s[c.id] }))
                      }
                      className="flex items-center justify-center h-7 w-7 rounded-md tap text-muted-foreground hover:bg-secondary"
                    >
                      {open ? (
                        <ChevronDown className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-xl"
                      style={{
                        backgroundColor: `${c.color}26`,
                        color: c.color,
                      }}
                    >
                      <Icon name={c.icon} className="h-4 w-4" />
                    </div>
                    <div className="flex-1 text-sm font-medium">
                      {categoryName(c)}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setCreatingParentId(c.id)}
                      aria-label={t("categories.add_subcategory")}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setEditing(c)}
                      aria-label={t("common.edit")}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  {open && c.children.length > 0 && (
                    <ul className="pb-2 pl-12 pr-2 space-y-1">
                      {c.children.map((sub) => (
                        <li
                          key={sub.id}
                          className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-secondary/50"
                        >
                          <div
                            className="flex h-7 w-7 items-center justify-center rounded-md"
                            style={{
                              backgroundColor: `${sub.color}26`,
                              color: sub.color,
                            }}
                          >
                            <Icon name={sub.icon} className="h-3 w-3" />
                          </div>
                          <div className="flex-1 text-sm">
                            {categoryName(sub)}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setEditing(sub)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      {archived.length > 0 && (
        <Card>
          <CardContent className="p-2">
            <div className="px-3 pt-2 pb-1 text-xs uppercase tracking-wide text-muted-foreground">
              {t("categories.archived")}
            </div>
            <ul className="divide-y divide-border">
              {archived.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center gap-2 p-2 opacity-70"
                >
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor: `${c.color}26`,
                      color: c.color,
                    }}
                  >
                    <Icon name={c.icon} className="h-4 w-4" />
                  </div>
                  <div className="flex-1 text-sm">{categoryName(c)}</div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      await restoreCategory(c.id);
                      toast.success(t("categories.toast_restored"));
                    }}
                  >
                    {t("common.restore")}
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon-sm"
                    onClick={async () => {
                      await deleteCategory(c.id);
                      toast(t("categories.toast_deleted_perm"));
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <BottomSheet
        open={!!editing || !!creatingParentId}
        onOpenChange={(o) => {
          if (!o) {
            setEditing(null);
            setCreatingParentId(null);
          }
        }}
        title={
          editing
            ? t("categories.edit_title")
            : t("categories.new_title")
        }
      >
        <CategoryForm
          mode={editing ? "edit" : "create"}
          initial={editing ?? undefined}
          defaultParentId={
            creatingParentId === "__new__" ? null : creatingParentId
          }
          onCancel={() => {
            setEditing(null);
            setCreatingParentId(null);
          }}
          onSubmit={async (draft) => {
            if (editing) {
              await updateCategory(editing.id, draft);
              toast.success(t("categories.toast_updated"));
            } else {
              await createCategory(draft);
              toast.success(t("categories.toast_created"));
            }
            setEditing(null);
            setCreatingParentId(null);
          }}
          onArchive={
            editing
              ? async () => {
                  await archiveCategory(editing.id);
                  toast(t("categories.toast_archived"));
                  setEditing(null);
                }
              : undefined
          }
        />
      </BottomSheet>
    </div>
  );
}

interface CategoryFormDraft {
  name: string;
  icon: string;
  color: string;
  parentId: string | null;
}

function CategoryForm({
  mode,
  initial,
  defaultParentId,
  onSubmit,
  onCancel,
  onArchive,
}: {
  mode: "create" | "edit";
  initial?: Category;
  defaultParentId: string | null | undefined;
  onSubmit: (draft: CategoryFormDraft) => Promise<void> | void;
  onCancel: () => void;
  onArchive?: () => Promise<void> | void;
}) {
  const t = useT();
  const [name, setName] = useState(initial?.name ?? "");
  const [icon, setIcon] = useState(initial?.icon ?? "Tag");
  const [color, setColor] = useState(initial?.color ?? COLORS[0]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-2xl bg-muted/40 p-4">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-2xl"
          style={{ backgroundColor: `${color}26`, color }}
        >
          <Icon name={icon} className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("categories.placeholder_name")}
          />
        </div>
      </div>

      <div>
        <Label>{t("common.icon")}</Label>
        <div className="mt-2 grid grid-cols-6 gap-1.5 sm:grid-cols-8">
          {ICONS.map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIcon(i)}
              className={cn(
                "flex h-10 items-center justify-center rounded-xl border tap",
                icon === i
                  ? "border-foreground bg-foreground/[0.05]"
                  : "border-border bg-card hover:bg-secondary/50",
              )}
            >
              <Icon name={i} className="h-4 w-4" />
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label>{t("common.color")}</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={cn(
                "h-8 w-8 rounded-full border-2 transition-transform tap",
                color === c
                  ? "border-foreground scale-110"
                  : "border-transparent",
              )}
              style={{ backgroundColor: c }}
              aria-label={c}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Button variant="ghost" className="flex-1" onClick={onCancel}>
          {t("common.cancel")}
        </Button>
        {onArchive && (
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onArchive()}
          >
            <Archive className="h-4 w-4" />
            {t("common.archive")}
          </Button>
        )}
        <Button
          className="flex-1"
          disabled={!name.trim()}
          onClick={() =>
            onSubmit({
              name: name.trim(),
              icon,
              color,
              parentId: initial?.parentId ?? defaultParentId ?? null,
            })
          }
        >
          {mode === "create" ? t("common.create") : t("common.save")}
        </Button>
      </div>
    </div>
  );
}
