import { create } from "zustand";
import type { ExpensePreset } from "@/types";

type AddExpensePayload = {
  prefilledAmount?: number;
  preset?: ExpensePreset;
};

interface UiState {
  addExpenseOpen: boolean;
  addExpensePayload: AddExpensePayload | null;
  openAddExpense: (payload?: AddExpensePayload) => void;
  closeAddExpense: () => void;

  commandOpen: boolean;
  setCommandOpen: (open: boolean) => void;
}

export const useUi = create<UiState>((set) => ({
  addExpenseOpen: false,
  addExpensePayload: null,
  openAddExpense: (payload) =>
    set({ addExpenseOpen: true, addExpensePayload: payload ?? null }),
  closeAddExpense: () => set({ addExpenseOpen: false, addExpensePayload: null }),

  commandOpen: false,
  setCommandOpen: (commandOpen) => set({ commandOpen }),
}));
