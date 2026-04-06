"use client";

import { useDeferredValue, useState, useTransition } from "react";

import type { RecommendationResult } from "@/lib/recommender";

type RecommendationWorkbenchProps = {
  categories: string[];
  ingredientCatalog: string[];
  popularIngredients: string[];
  defaultSelectedIngredients: string[];
  initialResults: RecommendationResult[];
};

type RecommendationApiResponse = {
  summary: {
    selectedIngredientCount: number;
    recommendationCount: number;
  };
  recommendations: RecommendationResult[];
};

export function RecommendationWorkbench({
  categories,
  ingredientCatalog,
  popularIngredients,
  defaultSelectedIngredients,
  initialResults,
}: RecommendationWorkbenchProps) {
  const [selectedIngredients, setSelectedIngredients] = useState(
    defaultSelectedIngredients,
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("all");
  const [maxMissing, setMaxMissing] = useState(2);
  const [limit, setLimit] = useState(6);
  const [results, setResults] = useState(initialResults);
  const [error, setError] = useState<string | null>(null);
  const [emptyNotice, setEmptyNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPending, startTransition] = useTransition();
  const deferredSearchTerm = useDeferredValue(searchTerm);

  const normalizedSearch = deferredSearchTerm.trim().toLowerCase();
  const selectedIngredientSet = new Set(selectedIngredients);
  const visibleIngredients = ingredientCatalog
    .filter((ingredient) => {
      if (selectedIngredientSet.has(ingredient)) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return ingredient.toLowerCase().includes(normalizedSearch);
    })
    .slice(0, 48);

  function toggleIngredient(ingredient: string) {
    setSelectedIngredients((current) =>
      current.includes(ingredient)
        ? current.filter((item) => item !== ingredient)
        : [...current, ingredient],
    );
  }

  function resetSelection() {
    setSelectedIngredients(defaultSelectedIngredients);
    setCategory("all");
    setMaxMissing(2);
    setLimit(6);
    setSearchTerm("");
    setError(null);
    setEmptyNotice(null);
    setResults(initialResults);
  }

  async function submitRecommendations() {
    setIsSubmitting(true);
    setError(null);
    setEmptyNotice(null);

    try {
      const response = await fetch("/api/recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ingredients: selectedIngredients,
          category,
          maxMissing,
          limit,
        }),
      });

      const data = (await response.json()) as RecommendationApiResponse & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Permintaan rekomendasi gagal diproses.");
      }

      startTransition(() => {
        setResults(data.recommendations);
        if (data.summary.recommendationCount === 0) {
          setEmptyNotice(
            "Belum ada cocktail yang memenuhi batas missing ingredient saat ini. Coba tambahkan bahan atau naikkan toleransi missing ingredient.",
          );
        }
      });
    } catch (fetchError) {
      const message =
        fetchError instanceof Error
          ? fetchError.message
          : "Terjadi kesalahan yang tidak terduga.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <div className="rounded-[2rem] border border-black/8 bg-white/85 p-6 shadow-[0_24px_80px_rgba(62,33,17,0.12)] backdrop-blur xl:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">
              Panel Input
            </p>
            <h2 className="mt-2 font-display text-3xl text-[var(--foreground)]">
              Pilih bahan yang tersedia
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)]">
              Mesin rekomendasi membandingkan vektor bahan pengguna dengan bahan
              tiap resep cocktail IBA, lalu memberi skor berdasarkan coverage
              bahan penting dan jumlah bahan yang masih kurang.
            </p>
          </div>
          <div className="rounded-2xl bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--muted)]">
            <p>
              Bahan dipilih:{" "}
              <span className="font-semibold text-[var(--foreground)]">
                {selectedIngredients.length}
              </span>
            </p>
            <p>
              Status render:{" "}
              <span className="font-semibold text-[var(--foreground)]">
                {isSubmitting || isPending ? "memproses" : "siap"}
              </span>
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {selectedIngredients.length === 0 ? (
            <p className="rounded-full border border-dashed border-black/15 px-4 py-2 text-sm text-[var(--muted)]">
              Belum ada bahan dipilih.
            </p>
          ) : (
            selectedIngredients.map((ingredient) => (
              <button
                key={ingredient}
                type="button"
                onClick={() => toggleIngredient(ingredient)}
                className="rounded-full border border-[var(--accent-soft)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
              >
                {ingredient} x
              </button>
            ))
          )}
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-[var(--foreground)]">
              Cari bahan
            </span>
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="mis. lemon, gin, vermouth"
              className="rounded-2xl border border-black/10 bg-[var(--surface)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-[var(--foreground)]">
              Kategori
            </span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="rounded-2xl border border-black/10 bg-[var(--surface)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
            >
              <option value="all">Semua kategori</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-[var(--foreground)]">
              Missing ingredient
            </span>
            <select
              value={maxMissing}
              onChange={(event) => setMaxMissing(Number(event.target.value))}
              className="rounded-2xl border border-black/10 bg-[var(--surface)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
            >
              {[0, 1, 2, 3, 4].map((value) => (
                <option key={value} value={value}>
                  Maks {value} bahan kurang
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-[var(--foreground)]">
              Jumlah hasil
            </span>
            <select
              value={limit}
              onChange={(event) => setLimit(Number(event.target.value))}
              className="rounded-2xl border border-black/10 bg-[var(--surface)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
            >
              {[4, 6, 8, 10].map((value) => (
                <option key={value} value={value}>
                  Top {value}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-6 rounded-[1.5rem] border border-black/8 bg-[var(--surface)] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
                Bahan Populer
              </h3>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Klik cepat untuk mengisi bahan umum yang sering muncul di
                dataset.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedIngredients([])}
              className="text-sm font-semibold text-[var(--accent)] transition hover:text-[var(--accent-strong)]"
            >
              Kosongkan pilihan
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {popularIngredients.map((ingredient) => (
              <button
                key={ingredient}
                type="button"
                onClick={() => toggleIngredient(ingredient)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                  selectedIngredientSet.has(ingredient)
                    ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                    : "border-black/8 bg-white text-[var(--foreground)] hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
                }`}
              >
                {ingredient}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-[1.5rem] border border-dashed border-black/10 bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
                Katalog Bahan
              </h3>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Menampilkan {visibleIngredients.length} bahan dari katalog yang
                sesuai pencarian saat ini.
              </p>
            </div>
            <button
              type="button"
              onClick={resetSelection}
              className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)] hover:bg-[var(--surface)]"
            >
              Kembalikan preset
            </button>
          </div>

          <div className="mt-4 grid max-h-[22rem] gap-2 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3">
            {visibleIngredients.map((ingredient) => (
              <button
                key={ingredient}
                type="button"
                onClick={() => toggleIngredient(ingredient)}
                className="rounded-2xl border border-black/8 bg-[var(--surface)] px-4 py-3 text-left text-sm text-[var(--foreground)] transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
              >
                {ingredient}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={submitRecommendations}
            disabled={selectedIngredients.length === 0 || isSubmitting}
            className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Menghitung rekomendasi..." : "Cari rekomendasi"}
          </button>
          <p className="text-sm text-[var(--muted)]">
            Endpoint backend: <code>/api/recommend</code>
          </p>
        </div>

        {error ? (
          <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}
      </div>

      <div className="rounded-[2rem] border border-black/8 bg-[#201313] p-6 text-white shadow-[0_24px_80px_rgba(62,33,17,0.28)] xl:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white/55">
              Hasil Rekomendasi
            </p>
            <h2 className="mt-2 font-display text-3xl">
              Cocktail paling cocok
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-white/70">
              Skor diurutkan berdasarkan weighted coverage bahan dan
              kelengkapan resep. Exact match akan diprioritaskan lebih dulu.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
            <p>
              Hasil tampil:{" "}
              <span className="font-semibold text-white">{results.length}</span>
            </p>
            <p>
              Toleransi kurang:{" "}
              <span className="font-semibold text-white">{maxMissing}</span>
            </p>
          </div>
        </div>

        {emptyNotice ? (
          <p className="mt-5 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
            {emptyNotice}
          </p>
        ) : null}

        <div className="mt-6 grid gap-4">
          {results.map((result) => (
            <article
              key={result.id}
              className="rounded-[1.5rem] border border-white/10 bg-white/6 p-5 backdrop-blur"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#f2bc8d]">
                    {result.category}
                  </p>
                  <h3 className="mt-2 font-display text-2xl text-white">
                    {result.name}
                  </h3>
                </div>
                <div className="min-w-28 rounded-2xl bg-white px-4 py-3 text-right text-[#201313]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a5b41]">
                    Skor
                  </p>
                  <p className="mt-1 text-2xl font-bold">
                    {Math.round(result.score * 100)}%
                  </p>
                </div>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#e97c52] via-[#f2bc8d] to-[#f7ddbf]"
                  style={{ width: `${Math.max(result.score * 100, 8)}%` }}
                />
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-[#f2bc8d] px-3 py-1 font-semibold text-[#201313]">
                  {result.fitLabel}
                </span>
                <span className="rounded-full border border-white/10 px-3 py-1 text-white/75">
                  Match {result.matchedIngredientCount}/{result.totalIngredientCount}
                </span>
                <span className="rounded-full border border-white/10 px-3 py-1 text-white/75">
                  Missing {result.missingIngredientCount}
                </span>
              </div>

              <p className="mt-4 text-sm leading-7 text-white/78">
                {result.rationale}
              </p>
              <p className="mt-3 text-sm leading-7 text-white/68">
                {result.method}
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/50">
                    Bahan tersedia
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {result.matchedIngredients.length === 0 ? (
                      <p className="text-sm text-white/60">Belum ada yang cocok.</p>
                    ) : (
                      result.matchedIngredients.map((ingredient) => (
                        <span
                          key={ingredient}
                          className="rounded-full bg-[#335b4c] px-3 py-1 text-xs font-medium text-[#ddf6ea]"
                        >
                          {ingredient}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/50">
                    Bahan kurang
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {result.missingIngredients.length === 0 ? (
                      <p className="text-sm text-white/60">
                        Tidak ada. Resep siap dibuat.
                      </p>
                    ) : (
                      result.missingIngredients.map((ingredient) => (
                        <span
                          key={ingredient}
                          className="rounded-full bg-[#5f3128] px-3 py-1 text-xs font-medium text-[#ffd8c2]"
                        >
                          {ingredient}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-black/15 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/50">
                  Resep asli IBA
                </p>
                <ul className="mt-3 grid gap-2 text-sm text-white/78">
                  {result.ingredientDirections.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
