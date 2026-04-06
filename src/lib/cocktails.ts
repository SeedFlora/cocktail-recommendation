import rawCocktails from "@/data/iba-cocktails.json";

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

const cocktailsDataset = rawCocktails as RawCocktail[];

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

export const cocktails: Cocktail[] = cocktailsDataset.map((cocktail) => ({
  ...cocktail,
  id: createCocktailId(cocktail.name),
  normalizedIngredients: cocktail.ingredients.map((item) =>
    normalizeIngredientName(item.ingredient),
  ),
}));

export const categories = Array.from(
  new Set(cocktails.map((cocktail) => cocktail.category)),
).sort((left, right) => left.localeCompare(right));

const ingredientFrequency = new Map<string, number>();
const ingredientLabelByNormalized = new Map<string, string>();

for (const cocktail of cocktails) {
  for (const ingredient of cocktail.ingredients) {
    const normalized = normalizeIngredientName(ingredient.ingredient);
    ingredientLabelByNormalized.set(normalized, ingredient.ingredient);
    ingredientFrequency.set(
      ingredient.ingredient,
      (ingredientFrequency.get(ingredient.ingredient) ?? 0) + 1,
    );
  }
}

export const ingredientCatalog = Array.from(
  new Set(cocktails.flatMap((cocktail) => cocktail.ingredients.map((item) => item.ingredient))),
).sort((left, right) => left.localeCompare(right));

export const popularIngredients = Array.from(ingredientFrequency.entries())
  .sort((left, right) => {
    if (right[1] !== left[1]) {
      return right[1] - left[1];
    }

    return left[0].localeCompare(right[0]);
  })
  .slice(0, 12)
  .map(([ingredient]) => ingredient);

export const defaultSelectedIngredients = [
  "Gin",
  "Fresh Lemon Juice",
  "Fresh Lime Juice",
  "Vodka",
  "White Rum",
  "Triple Sec",
  "Simple syrup",
];

export const cocktailStats = {
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

export function getIngredientLabel(normalizedIngredient: string) {
  return ingredientLabelByNormalized.get(normalizedIngredient) ?? normalizedIngredient;
}
