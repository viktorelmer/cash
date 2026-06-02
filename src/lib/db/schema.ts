import Dexie, { type Table } from "dexie";
import type {
  AppSettings,
  BudgetLimit,
  Category,
  Expense,
  ExpensePreset,
  Goal,
  Income,
  SalaryPlan,
  Subscription,
} from "@/types";

export class CashDB extends Dexie {
  expenses!: Table<Expense, string>;
  incomes!: Table<Income, string>;
  subscriptions!: Table<Subscription, string>;
  goals!: Table<Goal, string>;
  categories!: Table<Category, string>;
  budgets!: Table<BudgetLimit, string>;
  presets!: Table<ExpensePreset, string>;
  salaryPlans!: Table<SalaryPlan, string>;
  settings!: Table<AppSettings, string>;

  constructor() {
    super("cash-db");
    this.version(1).stores({
      expenses: "id, date, categoryId, subcategoryId, subscriptionId, createdAt",
      incomes: "id, date, type, recurring, createdAt",
      subscriptions: "id, nextPaymentDate, active, categoryId, createdAt",
      goals: "id, kind, deadline, createdAt",
      categories: "id, parentId, isDefault, name, archivedAt",
      budgets: "id, categoryId",
      presets: "id, name, createdAt",
      settings: "id",
    });
    this.version(2).stores({
      salaryPlans: "id, name, active, createdAt",
    });
  }
}

export const db = new CashDB();
