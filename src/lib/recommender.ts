import {
  getCocktailCatalog,
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

function getIngredientWeight(
  normalizedIngredient: string,
  documentFrequency: Map<string, number>,
  cocktailCount: number,
) {
  const df = documentFrequency.get(normalizedIngredient) ?? 1;
  return 1 + Math.log((cocktailCount + 1) / (df + 1));
}

function createRecommendation(
  cocktail: Cocktail,
  availableIngredients: Set<string>,
  documentFrequency: Map<string, number>,
  ingredientLabelByNormalized: Map<string, string>,
  cocktailCount: number,
): RecommendationResult {
  const matchedNormalized = cocktail.normalizedIngredients.filter((ingredient) =>
    availableIngredients.has(ingredient),
  );
  const missingNormalized = cocktail.normalizedIngredients.filter(
    (ingredient) => !availableIngredients.has(ingredient),
  );

  const recipeWeight = cocktail.normalizedIngredients.reduce(
    (total, ingredient) =>
      total +
      getIngredientWeight(ingredient, documentFrequency, cocktailCount),
    0,
  );
  const matchedWeight = matchedNormalized.reduce(
    (total, ingredient) =>
      total +
      getIngredientWeight(ingredient, documentFrequency, cocktailCount),
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
    matchedIngredients: matchedNormalized.map(
      (ingredient) => ingredientLabelByNormalized.get(ingredient) ?? ingredient,
    ),
    missingIngredients: missingNormalized.map(
      (ingredient) => ingredientLabelByNormalized.get(ingredient) ?? ingredient,
    ),
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

export async function recommendCocktails({
  ingredients,
  category,
  limit = 6,
  maxMissing = 2,
}: RecommendationInput) {
  const catalog = await getCocktailCatalog();
  const availableIngredients = new Set(
    ingredients
      .map(normalizeIngredientName)
      .filter((ingredient) => ingredient.length > 0),
  );

  if (availableIngredients.size === 0) {
    return [];
  }

  return catalog.cocktails
    .filter((cocktail) => !category || category === "all" || cocktail.category === category)
    .map((cocktail) =>
      createRecommendation(
        cocktail,
        availableIngredients,
        catalog.documentFrequency,
        catalog.ingredientLabelByNormalized,
        catalog.cocktails.length,
      ),
    )
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
