import { NextRequest, NextResponse } from "next/server";

import {
  categories,
  cocktailStats,
  ingredientCatalog,
} from "@/lib/cocktails";
import { recommendCocktails } from "@/lib/recommender";

export const runtime = "nodejs";

function normalizeLimit(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  if (Number.isNaN(parsed)) {
    return fallback;
  }

  return Math.min(Math.max(parsed, 1), 12);
}

function normalizeMaxMissing(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  if (Number.isNaN(parsed)) {
    return fallback;
  }

  return Math.min(Math.max(parsed, 0), 6);
}

function createResponse({
  ingredients,
  category,
  limit,
  maxMissing,
}: {
  ingredients: string[];
  category?: string;
  limit: number;
  maxMissing: number;
}) {
  const recommendations = recommendCocktails({
    ingredients,
    category,
    limit,
    maxMissing,
  });

  return {
    query: {
      ingredients,
      category: category && category !== "all" ? category : null,
      limit,
      maxMissing,
    },
    summary: {
      selectedIngredientCount: ingredients.length,
      recommendationCount: recommendations.length,
      cocktailCount: cocktailStats.cocktailCount,
      categoryCount: cocktailStats.categoryCount,
      ingredientCount: cocktailStats.ingredientCount,
    },
    meta: {
      categories,
      ingredientCatalogCount: ingredientCatalog.length,
    },
    recommendations,
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const ingredients =
    searchParams
      .get("ingredients")
      ?.split(",")
      .map((ingredient) => ingredient.trim())
      .filter(Boolean) ?? [];
  const category = searchParams.get("category") ?? "all";
  const limit = normalizeLimit(searchParams.get("limit"), 6);
  const maxMissing = normalizeMaxMissing(searchParams.get("maxMissing"), 2);

  return NextResponse.json(
    createResponse({
      ingredients,
      category,
      limit,
      maxMissing,
    }),
  );
}

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Body JSON tidak valid." },
      { status: 400 },
    );
  }

  const payload = body as {
    ingredients?: string[];
    category?: string;
    limit?: number;
    maxMissing?: number;
  };

  if (!Array.isArray(payload.ingredients)) {
    return NextResponse.json(
      { error: "Field ingredients wajib berupa array string." },
      { status: 400 },
    );
  }

  const ingredients = payload.ingredients
    .map((ingredient) => `${ingredient}`.trim())
    .filter(Boolean);
  const limit = Math.min(Math.max(payload.limit ?? 6, 1), 12);
  const maxMissing = Math.min(Math.max(payload.maxMissing ?? 2, 0), 6);
  const category = payload.category ?? "all";

  return NextResponse.json(
    createResponse({
      ingredients,
      category,
      limit,
      maxMissing,
    }),
  );
}
