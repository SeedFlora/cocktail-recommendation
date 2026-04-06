import {
  cocktails,
  getIngredientLabel,
  normalizeIngredientName,
  type Cocktail,
} from "@/lib/cocktails";

export type RecommendationInput = {
  ingredients: string[];
  category?: string;
  limit?: number;
  maxMissing?: number;
};

export type RecommendationResult = {
  id: string;
  name: string;
  category: string;
  method: string;
  ingredientDirections: string[];
  matchedIngredients: string[];
  missingIngredients: string[];
  matchedIngredientCount: number;
  totalIngredientCount: number;
  missingIngredientCount: number;
  weightedCoverage: number;
  score: number;
  fitLabel: string;
  rationale: string;
  exactMatch: boolean;
};

const documentFrequency = new Map<string, number>();

for (const cocktail of cocktails) {
  for (const ingredient of new Set(cocktail.normalizedIngredients)) {
    documentFrequency.set(
      ingredient,
      (documentFrequency.get(ingredient) ?? 0) + 1,
    );
  }
}

function getIngredientWeight(normalizedIngredient: string) {
  const df = documentFrequency.get(normalizedIngredient) ?? 1;
  return 1 + Math.log((cocktails.length + 1) / (df + 1));
}

function createRecommendation(
  cocktail: Cocktail,
  availableIngredients: Set<string>,
): RecommendationResult {
  const matchedNormalized = cocktail.normalizedIngredients.filter((ingredient) =>
    availableIngredients.has(ingredient),
  );
  const missingNormalized = cocktail.normalizedIngredients.filter(
    (ingredient) => !availableIngredients.has(ingredient),
  );

  const recipeWeight = cocktail.normalizedIngredients.reduce(
    (total, ingredient) => total + getIngredientWeight(ingredient),
    0,
  );
  const matchedWeight = matchedNormalized.reduce(
    (total, ingredient) => total + getIngredientWeight(ingredient),
    0,
  );

  const weightedCoverage = recipeWeight === 0 ? 0 : matchedWeight / recipeWeight;
  const exactCoverage =
    cocktail.normalizedIngredients.length === 0
      ? 0
      : matchedNormalized.length / cocktail.normalizedIngredients.length;
  const score = Number((weightedCoverage * 0.75 + exactCoverage * 0.25).toFixed(4));
  const exactMatch = missingNormalized.length === 0;

  let fitLabel = "Bahan inti belum cukup";
  let rationale = `Masih perlu ${missingNormalized.length} bahan tambahan untuk mendekati resep asli.`;

  if (exactMatch) {
    fitLabel = "Siap diracik sekarang";
    rationale = "Semua bahan resep sudah tersedia pada pilihan bahan pengguna.";
  } else if (weightedCoverage >= 0.8) {
    fitLabel = "Sangat dekat";
    rationale = `Mayoritas bahan kunci sudah tersedia, tinggal ${missingNormalized.length} bahan pelengkap.`;
  } else if (weightedCoverage >= 0.55) {
    fitLabel = "Cukup potensial";
    rationale = `Bahan khas utama sudah mulai cocok, tetapi resep masih memerlukan ${missingNormalized.length} bahan lagi.`;
  }

  return {
    id: cocktail.id,
    name: cocktail.name,
    category: cocktail.category,
    method: cocktail.method,
    ingredientDirections: cocktail.ingredients.map((ingredient) => ingredient.direction),
    matchedIngredients: matchedNormalized.map(getIngredientLabel),
    missingIngredients: missingNormalized.map(getIngredientLabel),
    matchedIngredientCount: matchedNormalized.length,
    totalIngredientCount: cocktail.ingredients.length,
    missingIngredientCount: missingNormalized.length,
    weightedCoverage: Number(weightedCoverage.toFixed(4)),
    score,
    fitLabel,
    rationale,
    exactMatch,
  };
}

export function recommendCocktails({
  ingredients,
  category,
  limit = 6,
  maxMissing = 2,
}: RecommendationInput) {
  const availableIngredients = new Set(
    ingredients
      .map(normalizeIngredientName)
      .filter((ingredient) => ingredient.length > 0),
  );

  if (availableIngredients.size === 0) {
    return [];
  }

  return cocktails
    .filter((cocktail) => !category || category === "all" || cocktail.category === category)
    .map((cocktail) => createRecommendation(cocktail, availableIngredients))
    .filter(
      (cocktail) =>
        cocktail.matchedIngredientCount > 0 &&
        cocktail.missingIngredientCount <= maxMissing,
    )
    .sort((left, right) => {
      if (Number(right.exactMatch) !== Number(left.exactMatch)) {
        return Number(right.exactMatch) - Number(left.exactMatch);
      }

      if (right.score !== left.score) {
        return right.score - left.score;
      }

      if (left.missingIngredientCount !== right.missingIngredientCount) {
        return left.missingIngredientCount - right.missingIngredientCount;
      }

      if (left.totalIngredientCount !== right.totalIngredientCount) {
        return left.totalIngredientCount - right.totalIngredientCount;
      }

      return left.name.localeCompare(right.name);
    })
    .slice(0, limit);
}
