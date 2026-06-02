import { db } from "./schema";
import type { AppSettings, Category, ExpensePreset } from "@/types";
import { uid } from "@/lib/utils";

interface SeedCategorySpec {
  id: string;
  name: string;
  icon: string;
  color: string;
  subs?: { id: string; name: string; icon: string; color: string }[];
}

const SEED_CATEGORIES: SeedCategorySpec[] = [
  {
    id: "cat_food",
    name: "Food",
    icon: "Utensils",
    color: "#F59E0B",
    subs: [
      { id: "cat_food_groceries", name: "Groceries", icon: "ShoppingBasket", color: "#F59E0B" },
      { id: "cat_food_restaurants", name: "Restaurants", icon: "UtensilsCrossed", color: "#F97316" },
      { id: "cat_food_coffee", name: "Coffee", icon: "Coffee", color: "#A16207" },
      { id: "cat_food_delivery", name: "Delivery", icon: "Bike", color: "#EA580C" },
    ],
  },
  {
    id: "cat_transport",
    name: "Transport",
    icon: "Car",
    color: "#3B82F6",
    subs: [
      { id: "cat_transport_taxi", name: "Taxi", icon: "CarTaxiFront", color: "#3B82F6" },
      { id: "cat_transport_fuel", name: "Fuel", icon: "Fuel", color: "#2563EB" },
      { id: "cat_transport_public", name: "Public transport", icon: "TramFront", color: "#1D4ED8" },
      { id: "cat_transport_parking", name: "Parking", icon: "ParkingSquare", color: "#1E40AF" },
    ],
  },
  {
    id: "cat_home",
    name: "Home",
    icon: "Home",
    color: "#10B981",
    subs: [
      { id: "cat_home_rent", name: "Rent", icon: "KeyRound", color: "#10B981" },
      { id: "cat_home_utilities", name: "Utilities", icon: "Lightbulb", color: "#059669" },
      { id: "cat_home_internet", name: "Internet", icon: "Wifi", color: "#047857" },
      { id: "cat_home_supplies", name: "Supplies", icon: "Package", color: "#065F46" },
    ],
  },
  {
    id: "cat_renovation",
    name: "Renovation",
    icon: "Hammer",
    color: "#8B5CF6",
    subs: [
      { id: "cat_renovation_kitchen", name: "Kitchen", icon: "ChefHat", color: "#8B5CF6" },
      { id: "cat_renovation_bathroom", name: "Bathroom", icon: "Bath", color: "#7C3AED" },
      { id: "cat_renovation_furniture", name: "Furniture", icon: "Sofa", color: "#6D28D9" },
      { id: "cat_renovation_tools", name: "Tools", icon: "Wrench", color: "#5B21B6" },
      { id: "cat_renovation_materials", name: "Materials", icon: "Boxes", color: "#4C1D95" },
    ],
  },
  {
    id: "cat_entertainment",
    name: "Entertainment",
    icon: "PartyPopper",
    color: "#EC4899",
    subs: [
      { id: "cat_entertainment_movies", name: "Movies", icon: "Clapperboard", color: "#EC4899" },
      { id: "cat_entertainment_events", name: "Events", icon: "Ticket", color: "#DB2777" },
      { id: "cat_entertainment_games", name: "Games", icon: "Gamepad2", color: "#BE185D" },
    ],
  },
  {
    id: "cat_subscriptions",
    name: "Subscriptions",
    icon: "Repeat",
    color: "#06B6D4",
    subs: [
      { id: "cat_subs_streaming", name: "Streaming", icon: "PlayCircle", color: "#06B6D4" },
      { id: "cat_subs_cloud", name: "Cloud", icon: "Cloud", color: "#0891B2" },
      { id: "cat_subs_software", name: "Software", icon: "AppWindow", color: "#0E7490" },
    ],
  },
  {
    id: "cat_health",
    name: "Health",
    icon: "HeartPulse",
    color: "#EF4444",
    subs: [
      { id: "cat_health_pharmacy", name: "Pharmacy", icon: "Pill", color: "#EF4444" },
      { id: "cat_health_doctor", name: "Doctor", icon: "Stethoscope", color: "#DC2626" },
      { id: "cat_health_fitness", name: "Fitness", icon: "Dumbbell", color: "#B91C1C" },
    ],
  },
  {
    id: "cat_shopping",
    name: "Shopping",
    icon: "ShoppingBag",
    color: "#F472B6",
    subs: [
      { id: "cat_shopping_clothes", name: "Clothes", icon: "Shirt", color: "#F472B6" },
      { id: "cat_shopping_electronics", name: "Electronics", icon: "Smartphone", color: "#EC4899" },
      { id: "cat_shopping_gifts", name: "Gifts", icon: "Gift", color: "#DB2777" },
    ],
  },
  {
    id: "cat_travel",
    name: "Travel",
    icon: "Plane",
    color: "#0EA5E9",
    subs: [
      { id: "cat_travel_flights", name: "Flights", icon: "PlaneTakeoff", color: "#0EA5E9" },
      { id: "cat_travel_stay", name: "Stay", icon: "BedDouble", color: "#0284C7" },
      { id: "cat_travel_food", name: "Food", icon: "Utensils", color: "#0369A1" },
    ],
  },
  {
    id: "cat_other",
    name: "Other",
    icon: "MoreHorizontal",
    color: "#71717A",
  },
];

/** Neutral defaults for a fresh install — no locale- or brand-specific values. */
export const DEFAULT_SETTINGS: AppSettings = {
  id: "settings",
  currency: "BYN",
  theme: "system",
  language: "be",
  defaultTaxRate: 0,
  weekStartsOn: 1,
  notificationsEnabled: false,
  startingBalance: null,
  startingBalanceAt: null,
  exchangeRates: null,
  exchangeRatesUpdatedAt: null,
  onboardingCompletedAt: null,
  disclaimerAcceptedAt: null,
};

function buildSeedCategories(now: number): Category[] {
  const out: Category[] = [];
  for (const cat of SEED_CATEGORIES) {
    out.push({
      id: cat.id,
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
      parentId: null,
      isDefault: true,
      createdAt: now,
      archivedAt: null,
    });
    for (const sub of cat.subs ?? []) {
      out.push({
        id: sub.id,
        name: sub.name,
        icon: sub.icon,
        color: sub.color,
        parentId: cat.id,
        isDefault: true,
        createdAt: now,
        archivedAt: null,
      });
    }
  }
  return out;
}

function buildSeedPresets(now: number): ExpensePreset[] {
  return [
    {
      id: uid("preset"),
      name: "Coffee",
      amount: 5,
      currency: DEFAULT_SETTINGS.currency,
      categoryId: "cat_food",
      subcategoryId: "cat_food_coffee",
      icon: "Coffee",
      color: "#A16207",
      note: "",
      createdAt: now,
    },
    {
      id: uid("preset"),
      name: "Groceries",
      amount: 50,
      currency: DEFAULT_SETTINGS.currency,
      categoryId: "cat_food",
      subcategoryId: "cat_food_groceries",
      icon: "ShoppingBasket",
      color: "#F59E0B",
      note: "",
      createdAt: now,
    },
    {
      id: uid("preset"),
      name: "Transport",
      amount: 10,
      currency: DEFAULT_SETTINGS.currency,
      categoryId: "cat_transport",
      subcategoryId: "cat_transport_public",
      icon: "TramFront",
      color: "#3B82F6",
      note: "",
      createdAt: now,
    },
  ];
}

export async function seedDatabaseIfEmpty(): Promise<void> {
  const now = Date.now();

  const existingSettings = await db.settings.get("settings");
  if (!existingSettings) {
    await db.settings.put(DEFAULT_SETTINGS);
  }

  const categoryCount = await db.categories.count();
  if (categoryCount === 0) {
    await db.categories.bulkPut(buildSeedCategories(now));
  }

  const presetCount = await db.presets.count();
  if (presetCount === 0) {
    await db.presets.bulkPut(buildSeedPresets(now));
  }
}

export async function resetDatabase(): Promise<void> {
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
    },
  );
  await seedDatabaseIfEmpty();
}
