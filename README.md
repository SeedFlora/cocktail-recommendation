# cocktail-recommendation

Sistem rekomendasi resep cocktail berbasis ketersediaan bahan dengan pendekatan content-based filtering. Aplikasi ini dibangun menggunakan Next.js App Router dan dideploy sebagai satu service full-stack di Vercel, sehingga frontend dan backend API berjalan dalam satu project.

Live app:

- https://mixmatcher-iba.vercel.app

## Latar Belakang

Topik ini cocok untuk pengembangan skripsi dengan fokus pada sistem rekomendasi resep minuman berdasarkan ingredient matching. Dataset berasal dari koleksi cocktail resmi IBA dan telah dinormalisasi ke dalam format lokal agar stabil untuk kebutuhan build dan deployment.

Masalah yang diselesaikan:

- Pengguna sering tidak tahu resep apa yang dapat dibuat dari bahan yang sudah tersedia.
- Tidak semua pengguna membutuhkan rekomendasi berbasis rating historis.
- Dataset tidak memiliki interaksi user-item, sehingga content-based filtering lebih tepat dibanding collaborative filtering murni.

## Tujuan Sistem

- Merekomendasikan resep cocktail yang paling sesuai dengan bahan yang dimiliki pengguna.
- Menampilkan bahan yang sudah cocok dan bahan yang masih kurang.
- Memberikan skor kecocokan agar hasil dapat diurutkan secara objektif.
- Menyediakan prototype web yang dapat digunakan sebagai demonstrasi penelitian.

## Fitur Utama

- Pemilihan bahan secara interaktif dari katalog ingredient.
- Preset bahan populer untuk simulasi cepat.
- Filter berdasarkan kategori cocktail.
- Pengaturan jumlah rekomendasi.
- Pengaturan batas toleransi missing ingredient.
- Hasil rekomendasi dengan skor, status kecocokan, bahan tersedia, bahan kurang, dan resep asli.
- Backend API `GET /api/recommend` dan `POST /api/recommend`.

## Dataset

Sumber data:

- Repository: `rasmusab/iba-cocktails`
- Endpoint sumber: `https://raw.githubusercontent.com/rasmusab/iba-cocktails/main/iba-web/iba-cocktails-web.json`

Karakteristik dataset pada implementasi ini:

- 90 resep cocktail
- 3 kategori utama
- 168 bahan unik hasil normalisasi katalog

Alasan dataset diambil dari upstream saat build/runtime server:

- Repository tetap ringan dan mudah dipush ke GitHub.
- Data sumber tetap mengacu ke dataset publik yang sama.
- Server Next.js tetap bisa melakukan caching dengan revalidate harian.

## Metode Rekomendasi

Sistem menggunakan content-based filtering berbasis kemiripan komposisi bahan. Setiap cocktail direpresentasikan sebagai himpunan ingredient, lalu dibandingkan dengan himpunan bahan yang dipilih pengguna.

Langkah umum:

1. Sistem menormalisasi nama bahan.
2. Sistem membentuk profil pengguna dari bahan yang tersedia.
3. Sistem menghitung kecocokan tiap cocktail berdasarkan bahan yang match dan yang masih missing.
4. Sistem memberi bobot lebih tinggi pada bahan yang lebih khas atau lebih jarang muncul.
5. Sistem mengurutkan hasil berdasarkan exact match, skor, dan jumlah bahan yang kurang.

Komponen skor:

- `weightedCoverage`: proporsi kecocokan bahan dengan bobot kepentingan.
- `exactCoverage`: proporsi jumlah bahan resep yang benar-benar tersedia.

Rumus implementasi saat ini:

```txt
score = (weightedCoverage * 0.75) + (exactCoverage * 0.25)
```

Aturan pengurutan:

- Exact match diprioritaskan paling atas.
- Skor lebih tinggi diprioritaskan.
- Missing ingredient lebih sedikit diprioritaskan.
- Resep yang lebih ringkas diprioritaskan jika skor sama.

## Arsitektur Aplikasi

Project ini menggunakan satu codebase full-stack:

- Frontend: Next.js App Router
- Backend: Next.js Route Handlers
- Styling: Tailwind CSS v4
- Deployment: Vercel

Alur aplikasi:

1. Pengguna memilih bahan pada antarmuka web.
2. Frontend mengirim request ke `/api/recommend`.
3. Backend menghitung skor rekomendasi dari dataset lokal.
4. Hasil dikirim kembali dalam format JSON.
5. Frontend menampilkan ranking cocktail paling relevan.

## Struktur Project

```txt
src/
  app/
    api/recommend/route.ts
    globals.css
    layout.tsx
    page.tsx
  components/
    recommendation-workbench.tsx
  lib/
    cocktails.ts
    recommender.ts
scripts/
  deploy-vercel.ps1
```

Keterangan file penting:

- `src/app/page.tsx`: landing page dan dashboard utama.
- `src/components/recommendation-workbench.tsx`: panel input bahan dan hasil rekomendasi.
- `src/app/api/recommend/route.ts`: endpoint backend untuk rekomendasi.
- `src/lib/cocktails.ts`: fetch dataset upstream, normalisasi data, katalog bahan, dan statistik.
- `src/lib/recommender.ts`: logika content-based filtering dan scoring.
- `scripts/deploy-vercel.ps1`: helper deploy ke Vercel menggunakan token.

## API

### GET `/api/recommend`

Query parameters:

- `ingredients`: daftar bahan dipisahkan koma
- `category`: kategori cocktail atau `all`
- `limit`: jumlah hasil maksimum
- `maxMissing`: jumlah bahan kurang yang masih ditoleransi

Contoh:

```txt
/api/recommend?ingredients=Gin,Fresh%20Lemon%20Juice,Triple%20Sec&maxMissing=1&limit=3
```

### POST `/api/recommend`

Body JSON:

```json
{
  "ingredients": ["Gin", "Fresh Lemon Juice", "Triple Sec"],
  "category": "all",
  "limit": 6,
  "maxMissing": 2
}
```

Contoh respons ringkas:

```json
{
  "summary": {
    "selectedIngredientCount": 3,
    "recommendationCount": 3
  },
  "recommendations": [
    {
      "name": "White Lady",
      "score": 1,
      "matchedIngredients": ["Gin", "Triple Sec", "Fresh Lemon Juice"],
      "missingIngredients": []
    }
  ]
}
```

## Menjalankan Secara Lokal

### Opsi 1: Node.js lokal

Jika Node.js sudah terpasang:

```bash
npm install
npm run dev
```

### Opsi 2: Docker

Karena environment pengembangan ini memanfaatkan Docker untuk tool Node.js, aplikasi juga bisa dijalankan tanpa instalasi Node lokal.

Development mode:

```bash
docker run --rm -p 3000:3000 -v "${PWD}:/app" -w /app node:22-alpine sh -lc "npm install && npm run dev -- --hostname 0.0.0.0"
```

Build production:

```bash
docker run --rm -v "${PWD}:/app" -w /app node:22-alpine sh -lc "npm install && npm run build"
```

## Deploy ke Vercel

Project ini sudah berhasil dideploy ke production:

- Production URL: https://mixmatcher-iba.vercel.app

Jika ingin redeploy menggunakan token Vercel:

```powershell
$env:VERCEL_TOKEN="token_kamu"
.\scripts\deploy-vercel.ps1
```

Preview deploy:

```powershell
$env:VERCEL_TOKEN="token_kamu"
.\scripts\deploy-vercel.ps1 -Preview
```

Environment variable opsional:

- `VERCEL_SCOPE`
- `VERCEL_PROJECT_NAME`

## Pengujian

Verifikasi yang sudah dijalankan pada project ini:

- `npm run lint`
- `npm run build`
- Smoke test endpoint `/api/recommend`

Status terakhir:

- Lint sukses
- Build sukses
- API production merespons `200 OK`

Catatan implementasi:

- Halaman utama diprerender dengan `revalidate` 1 hari.
- API route tetap dinamis, tetapi memanfaatkan fetch ter-cache dari dataset upstream.

## Relevansi Untuk Skripsi

Contoh judul yang sesuai:

- `Rancang Bangun Sistem Rekomendasi Resep Cocktail Berdasarkan Ketersediaan Bahan Menggunakan Content-Based Filtering`

Komponen penelitian yang bisa diangkat:

- Analisis kebutuhan sistem rekomendasi berbasis ingredient.
- Representasi item berbasis fitur konten.
- Perancangan formula scoring dan ranking.
- Implementasi web prototype.
- Evaluasi menggunakan pengujian fungsional, precision@k, dan kuesioner pengguna.

## Pengembangan Lanjutan

- Menambahkan sinonim bahan untuk matching yang lebih fleksibel.
- Menambahkan mode non-alkohol atau mocktail.
- Menyimpan histori pencarian pengguna.
- Menambahkan evaluasi eksplisit untuk precision, recall, dan kepuasan pengguna.
- Menambahkan collaborative signal bila nanti tersedia data rating atau klik pengguna.

## Catatan

- Objek penelitian menggunakan data cocktail, jadi perlu disesuaikan dengan kebijakan kampus atau pembimbing.
- Untuk kebutuhan akademik yang lebih aman, framing penelitian dapat diarahkan ke sistem rekomendasi resep minuman berbasis ingredient matching.

## License

Silakan sesuaikan license repository sesuai kebutuhan pemilik repo.
