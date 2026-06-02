import { useMemo } from "react";
import type { Category } from "@/types";
import { useT } from "@/i18n";

const SEED_NAMES: Record<string, string> = {
  cat_food: "Food",
  cat_food_groceries: "Groceries",
  cat_food_restaurants: "Restaurants",
  cat_food_coffee: "Coffee",
  cat_food_delivery: "Delivery",
  cat_transport: "Transport",
  cat_transport_taxi: "Taxi",
  cat_transport_fuel: "Fuel",
  cat_transport_public: "Public transport",
  cat_transport_parking: "Parking",
  cat_home: "Home",
  cat_home_rent: "Rent",
  cat_home_utilities: "Utilities",
  cat_home_internet: "Internet",
  cat_home_supplies: "Supplies",
  cat_renovation: "Renovation",
  cat_renovation_kitchen: "Kitchen",
  cat_renovation_bathroom: "Bathroom",
  cat_renovation_furniture: "Furniture",
  cat_renovation_tools: "Tools",
  cat_renovation_materials: "Materials",
  cat_entertainment: "Entertainment",
  cat_entertainment_movies: "Movies",
  cat_entertainment_events: "Events",
  cat_entertainment_games: "Games",
  cat_subscriptions: "Subscriptions",
  cat_subs_streaming: "Streaming",
  cat_subs_cloud: "Cloud",
  cat_subs_software: "Software",
  cat_health: "Health",
  cat_health_pharmacy: "Pharmacy",
  cat_health_doctor: "Doctor",
  cat_health_fitness: "Fitness",
  cat_shopping: "Shopping",
  cat_shopping_clothes: "Clothes",
  cat_shopping_electronics: "Electronics",
  cat_shopping_gifts: "Gifts",
  cat_travel: "Travel",
  cat_travel_flights: "Flights",
  cat_travel_stay: "Stay",
  cat_travel_food: "Food",
  cat_other: "Other",
};

export function useCategoryName() {
  const t = useT();
  return useMemo(() => {
    return (category: Category | null | undefined): string => {
      if (!category) return t("category.uncategorized");
      const seedName = SEED_NAMES[category.id];
      if (seedName && category.name === seedName) {
        return t(`categories.defaults.${category.id}`);
      }
      return category.name;
    };
  }, [t]);
}
