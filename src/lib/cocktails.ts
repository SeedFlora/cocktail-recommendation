import { cache } from "react";

export type RawIngredient = {
  direction: string;
  quantity: string;
  unit: string;
  ingredient: string;
};

export type RawCocktail = {
  category: string;
  name: string;
  method: string;
  ingredients: RawIngredient[];
};

export type Cocktail = RawCocktail & {
  id: string;
  normalizedIngredients: string[];
};

export type CocktailStats = {
  cocktailCount: number;
  categoryCount: number;
  ingredientCount: number;
  averageIngredientsPerCocktail: number;
};

export type CocktailCatalog = {
  cocktails: Cocktail[];
  categories: string[];
  ingredientCatalog: string[];
  popularIngredients: string[];
  cocktailStats: CocktailStats;
  ingredientLabelByNormalized: Map<string, string>;
  documentFrequency: Map<string, number>;
};

const DATASET_URL =
  "https://raw.githubusercontent.com/rasmusab/iba-cocktails/main/iba-web/iba-cocktails-web.json";

export const defaultSelectedIngredients = [
  "Gin",
  "Fresh Lemon Juice",
  "Fresh Lime Juice",
  "Vodka",
  "White Rum",
  "Triple Sec",
  "Simple syrup",
];

export function normalizeIngredientName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function createCocktailId(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function fetchRawCocktails() {
  const response = await fetch(DATASET_URL, {
    next: {
      revalidate: 60 * 60 * 24,
    },
  });

  if (!response.ok) {
    throw new Error(`Gagal memuat dataset cocktail: ${response.status}`);
  }

  return (await response.json()) as RawCocktail[];
}

export const getCocktailCatalog = cache(async (): Promise<CocktailCatalog> => {
  const cocktailsDataset = await fetchRawCocktails();
  const cocktails: Cocktail[] = cocktailsDataset.map((cocktail) => ({
    ...cocktail,
    id: createCocktailId(cocktail.name),
    normalizedIngredients: cocktail.ingredients.map((item) =>
      normalizeIngredientName(item.ingredient),
    ),
  }));

  const categories = Array.from(
    new Set(cocktails.map((cocktail) => cocktail.category)),
  ).sort((left, right) => left.localeCompare(right));

  const ingredientFrequency = new Map<string, number>();
  const ingredientLabelByNormalized = new Map<string, string>();
  const documentFrequency = new Map<string, number>();

  for (const cocktail of cocktails) {
    for (const ingredient of cocktail.ingredients) {
      const normalized = normalizeIngredientName(ingredient.ingredient);
      ingredientLabelByNormalized.set(normalized, ingredient.ingredient);
      ingredientFrequency.set(
        ingredient.ingredient,
        (ingredientFrequency.get(ingredient.ingredient) ?? 0) + 1,
      );
    }

    for (const ingredient of new Set(cocktail.normalizedIngredients)) {
      documentFrequency.set(
        ingredient,
        (documentFrequency.get(ingredient) ?? 0) + 1,
      );
    }
  }

  const ingredientCatalog = Array.from(
    new Set(
      cocktails.flatMap((cocktail) =>
        cocktail.ingredients.map((item) => item.ingredient),
      ),
    ),
  ).sort((left, right) => left.localeCompare(right));

  const popularIngredients = Array.from(ingredientFrequency.entries())
    .sort((left, right) => {
      if (right[1] !== left[1]) {
        return right[1] - left[1];
      }

      return left[0].localeCompare(right[0]);
    })
    .slice(0, 12)
    .map(([ingredient]) => ingredient);

  const cocktailStats = {
    cocktailCount: cocktails.length,
    categoryCount: categories.length,
    ingredientCount: ingredientCatalog.length,
    averageIngredientsPerCocktail: Number(
      (
        cocktails.reduce(
          (total, cocktail) => total + cocktail.ingredients.length,
          0,
        ) / cocktails.length
      ).toFixed(1),
    ),
  };

  return {
    cocktails,
    categories,
    ingredientCatalog,
    popularIngredients,
    cocktailStats,
    ingredientLabelByNormalized,
    documentFrequency,
  };
});
