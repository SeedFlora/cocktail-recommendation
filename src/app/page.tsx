import { RecommendationWorkbench } from "@/components/recommendation-workbench";
import {
  categories,
  cocktailStats,
  defaultSelectedIngredients,
  ingredientCatalog,
  popularIngredients,
} from "@/lib/cocktails";
import { recommendCocktails } from "@/lib/recommender";

export default function Home() {
  const initialResults = recommendCocktails({
    ingredients: defaultSelectedIngredients,
    maxMissing: 2,
    limit: 6,
  });

  return (
    <div className="flex flex-1">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        <section className="grid gap-6 rounded-[2.5rem] border border-black/8 bg-white/75 p-6 shadow-[0_30px_100px_rgba(62,33,17,0.12)] backdrop-blur lg:grid-cols-[1.2fr_0.8fr] lg:p-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">
              Rancang Bangun Sistem Rekomendasi
            </p>
            <h1 className="mt-4 max-w-3xl font-display text-5xl leading-[1.02] text-[var(--foreground)] sm:text-6xl">
              MixMatcher IBA membantu memilih resep cocktail dari bahan yang
              sudah tersedia.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-[var(--muted)] sm:text-lg">
              Prototype ini mengimplementasikan content-based filtering berbasis
              ingredient matching. Sistem membandingkan bahan yang dipilih
              pengguna dengan komposisi resep cocktail IBA, lalu menghitung skor
              kecocokan untuk menghasilkan rekomendasi yang paling relevan.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <span className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white">
                Frontend + backend dalam satu deploy Vercel
              </span>
              <span className="rounded-full border border-black/10 bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--foreground)]">
                API route: <code>/api/recommend</code>
              </span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-[2rem] bg-[#201313] p-6 text-white">
              <p className="text-sm uppercase tracking-[0.28em] text-white/55">
                Dataset
              </p>
              <p className="mt-4 font-display text-5xl">
                {cocktailStats.cocktailCount}
              </p>
              <p className="mt-2 text-sm leading-7 text-white/75">
                resep cocktail resmi IBA siap dianalisis oleh mesin rekomendasi.
              </p>
            </div>

            <div className="rounded-[2rem] border border-black/8 bg-[var(--surface)] p-6">
              <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-[var(--muted)]">
                    Bahan unik
                  </p>
                  <p className="mt-2 font-display text-4xl text-[var(--foreground)]">
                    {cocktailStats.ingredientCount}
                  </p>
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-[var(--muted)]">
                    Kategori
                  </p>
                  <p className="mt-2 font-display text-4xl text-[var(--foreground)]">
                    {cocktailStats.categoryCount}
                  </p>
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-[var(--muted)]">
                    Rata-rata bahan
                  </p>
                  <p className="mt-2 font-display text-4xl text-[var(--foreground)]">
                    {cocktailStats.averageIngredientsPerCocktail}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: "1. Representasi konten",
              description:
                "Setiap cocktail direpresentasikan sebagai vektor biner dari bahan penyusunnya.",
            },
            {
              title: "2. Profil pengguna",
              description:
                "Pilihan bahan pengguna membentuk profil preferensi sementara berdasarkan pantry yang tersedia.",
            },
            {
              title: "3. Pengurutan skor",
              description:
                "Sistem menghitung weighted coverage, jumlah bahan cocok, dan penalti missing ingredient.",
            },
          ].map((item) => (
            <article
              key={item.title}
              className="rounded-[1.75rem] border border-black/8 bg-white/70 p-6 shadow-[0_20px_50px_rgba(62,33,17,0.08)] backdrop-blur"
            >
              <h2 className="font-display text-2xl text-[var(--foreground)]">
                {item.title}
              </h2>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                {item.description}
              </p>
            </article>
          ))}
        </section>

        <RecommendationWorkbench
          categories={categories}
          ingredientCatalog={ingredientCatalog}
          popularIngredients={popularIngredients}
          defaultSelectedIngredients={defaultSelectedIngredients}
          initialResults={initialResults}
        />
      </main>
    </div>
  );
}
