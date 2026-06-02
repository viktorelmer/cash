import { db } from "./schema";
import type { BackupBundle } from "@/types";

export async function exportBackup(): Promise<BackupBundle> {
  const [
    expenses,
    incomes,
    subscriptions,
    goals,
    categories,
    budgets,
    presets,
    salaryPlans,
    settings,
  ] = await Promise.all([
    db.expenses.toArray(),
    db.incomes.toArray(),
    db.subscriptions.toArray(),
    db.goals.toArray(),
    db.categories.toArray(),
    db.budgets.toArray(),
    db.presets.toArray(),
    db.salaryPlans.toArray(),
    db.settings.get("settings"),
  ]);

  return {
    version: 1,
    app: "cash",
    exportedAt: Date.now(),
    data: {
      expenses,
      incomes,
      subscriptions,
      goals,
      categories,
      budgets,
      presets,
      salaryPlans,
      settings: settings ?? null,
    },
  };
}

export async function downloadBackup(): Promise<void> {
  const bundle = await exportBackup();
  const blob = new Blob([JSON.stringify(bundle, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date(bundle.exportedAt).toISOString().slice(0, 10);
  a.href = url;
  a.download = `cash-backup-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function assertBundle(bundle: unknown): asserts bundle is BackupBundle {
  if (
    !bundle ||
    typeof bundle !== "object" ||
    (bundle as { app?: unknown }).app !== "cash" ||
    (bundle as { version?: unknown }).version !== 1 ||
    !(bundle as { data?: unknown }).data
  ) {
    throw new Error("Invalid backup file");
  }
}

export async function importBackup(
  raw: string,
  mode: "replace" | "merge" = "replace",
): Promise<void> {
  const parsed = JSON.parse(raw) as unknown;
  assertBundle(parsed);
  const bundle = parsed;

  await db.transaction(
    "rw",
    [
      db.expenses,
      db.incomes,
      db.subscriptions,
      db.goals,
      db.categories,
      db.budgets,
      db.presets,
      db.salaryPlans,
      db.settings,
    ],
    async () => {
      if (mode === "replace") {
        await Promise.all([
          db.expenses.clear(),
          db.incomes.clear(),
          db.subscriptions.clear(),
          db.goals.clear(),
          db.categories.clear(),
          db.budgets.clear(),
          db.presets.clear(),
          db.salaryPlans.clear(),
          db.settings.clear(),
        ]);
      }
      await Promise.all([
        db.expenses.bulkPut(bundle.data.expenses),
        db.incomes.bulkPut(bundle.data.incomes),
        db.subscriptions.bulkPut(bundle.data.subscriptions),
        db.goals.bulkPut(bundle.data.goals),
        db.categories.bulkPut(bundle.data.categories),
        db.budgets.bulkPut(bundle.data.budgets),
        db.presets.bulkPut(bundle.data.presets),
        db.salaryPlans.bulkPut(bundle.data.salaryPlans ?? []),
        bundle.data.settings
          ? db.settings.put(bundle.data.settings)
          : Promise.resolve(),
      ]);
    },
  );
}
