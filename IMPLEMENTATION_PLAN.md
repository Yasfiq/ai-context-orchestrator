# IMPLEMENTATION_PLAN.md
## AI Context Orchestrator

Dokumen ini memuat peta jalan implementasi (Implementation Plan) yang dipecah menjadi tugas-tugas kecil (micro-tasks). Setiap agen AI harus menyelesaikan satu fase dengan sempurna sebelum diizinkan melangkah ke fase berikutnya.

---

### FASE 1: Inisialisasi Proyek & Konfigurasi Dasar
**Tujuan:** Membangun fondasi Next.js, instalasi pustaka inti, dan penyiapan variabel lingkungan (environment variables).
*   **Langkah 1:** Inisialisasi proyek Next.js dengan App Router dan TypeScript (`npx create-next-app@latest`).
*   **Langkah 2:** Instalasi dan konfigurasi Tailwind CSS beserta Shadcn UI (`npx shadcn-ui@latest init`). Konfigurasikan warna kustom pada `tailwind.config.ts`:
    *   `background`: `#121619` (Deep Charcoal)
    *   `primary`: `#4338CA` (Cobalt Blue)
    *   `success`: `#10B981` (Emerald Green)
    *   `text-main`: `#E2E8F0` (Off-White)
*   **Langkah 3:** Instalasi pustaka pendukung mutlak: `zustand` (State Management) dan `ai` (Vercel AI SDK).
*   **Langkah 4:** Buat struktur direktori (scaffolding) sesuai dengan `ARCHITECTURE.md` (buat folder `/store`, `/prompts`, `/components/features`, `/types`).
*   **Kriteria Selesai:** Aplikasi dapat berjalan di `localhost:3000` dengan halaman kosong berlatar belakang *Deep Charcoal*, tanpa *error* pada konsol.

---

### FASE 2: Manajemen State (Zustand) & Tipe Data
**Tujuan:** Menyiapkan penyimpanan *stateless* di memori klien untuk 8 variabel "Must-Haves".
*   **Langkah 1:** Buat file `/types/schema.ts` yang berisi `interface` untuk 8 variabel: `projectVision`, `userRolesPermissions`, `keyFeatures`, `techStackCore`, `dataFlowIntegration`, `qaAndTesting`, `securityCompliance`, dan `teamPersonas`.
*   **Langkah 2:** Buat file `/store/use-app-store.ts` menggunakan Zustand.
*   **Langkah 3:** Definisikan *initial state* (kosong/null) dan aksi (*actions*) untuk memperbarui masing-masing variabel tersebut. Tambahkan boolean state `isOnboardingComplete`.
*   **Kriteria Selesai:** *Store* Zustand berhasil dibuat dan siap dipanggil (import) oleh komponen UI tanpa *error* TypeScript.

---

### FASE 3: Editorial Systems Console (Sisi Klien)
**Tujuan:** Membangun ruang kerja pengambilan keputusan untuk proses onboarding.
*   **Langkah 1:** Buat layout utama dengan token visual, mode gelap, focus-visible, safe-area, dan reduced motion.
*   **Langkah 2:** Buat workspace onboarding dengan decision ledger, progress context, recommendation options, dan input dinamis.
*   **Langkah 3:** Hubungkan input pengguna di `ZenTerminal.tsx` dengan store Zustand. (Catatan: Logika balasan AI belum diaktifkan di sini, cukup buat UI pengiriman pesan dan *rendering* teks/opsi bantuan statis).
*   **Kriteria Selesai:** Pengguna dapat menyelesaikan onboarding pada desktop dan mobile dengan hierarchy, copy, dan status yang konsisten.

---

### FASE 4: Integrasi Vercel AI SDK & Endpoint Onboarding
**Tujuan:** Mengaktifkan kecerdasan buatan untuk merespons obrolan pengguna dan mengekstraksi 8 variabel wajib.
*   **Langkah 1:** Buat file `/prompts/onboarding-prompt.ts` dan masukkan *System Prompt* ketat yang dirancang untuk AI Context Architect beserta *Security Guardrails* (Anti-Prompt Injection).
*   **Langkah 2:** Buat Next.js Route Handler di `/api/chat/route.ts` menggunakan Vercel AI SDK (`streamText` atau fungsi sejenis) untuk menangani percakapan.
*   **Langkah 3:** Gunakan teknik *Structured Output* (Tool calling / JSON Schema di Vercel AI SDK) agar AI di *backend* dapat memicu pembaruan pada 8 variabel Zustand di *frontend* secara tersembunyi.
*   **Langkah 4:** Implementasikan logika *Unlock*: Jika semua 8 variabel terisi, ubah *state* `isOnboardingComplete` menjadi `true`.
*   **Kriteria Selesai:** Pengguna dapat mengobrol dengan AI, dan secara *real-time*, AI berhasil mengenali dan mengisi variabel *state* Zustand di latar belakang.

---

### FASE 5: Chain of Prompts (CoP) Engine
**Tujuan:** Membangun mesin pemroses untuk menghasilkan dokumen spesifikasi.
*   **Langkah 1:** Buat endpoint baru `/api/generate/route.ts`.
*   **Langkah 2:** Buat file `/prompts/cop-pipeline.ts`. Rancang logika sekuensial di *backend*:
    *   *Step 1:* Kirim 8 variabel ke LLM untuk membuat draft `PRD`.
    *   *Step 2:* Kirim 8 variabel + hasil draft `PRD` untuk membuat `ARCHITECTURE.md`.
    *   *Step 3:* Kirim variabel + `ARCHITECTURE.md` untuk membuat `AGENTS.md` & `RULES.md`.
*   **Langkah 3:** Kembalikan semua hasil generasi dokumen dalam bentuk struktur JSON ke *frontend*.
*   **Kriteria Selesai:** Endpoint `/api/generate` mampu menerima *payload* 8 variabel dan mengembalikan 4+ dokumen Markdown yang lengkap dan terstruktur tanpa terpotong (Timeout/Rate Limit ditangani).

---

### FASE 6: Layar Hasil (Result Files) & Ekspor PDF
**Tujuan:** Menampilkan hasil kepada pengguna dan menyediakan sistem revisi berbasis arahan.
*   **Langkah 1:** Buat results workspace dengan document rail di desktop dan document switcher di mobile.
*   **Langkah 2:** Tambahkan pustaka rendering Markdown (seperti `react-markdown` atau `mdx`) untuk menampilkan teks secara visual.
*   **Langkah 3:** Implementasikan fungsi konversi `PRD` menjadi file `.pdf` di sisi klien (bisa menggunakan `html2pdf.js` atau pustaka ringan serupa yang tidak memerlukan *backend*). Tambahkan tombol ekspor/unduh.
*   **Langkah 4:** Buat panel revisi di bawah reader untuk mengirim arahan perubahan tanpa me-reset keseluruhan dokumen.
*   **Kriteria Selesai:** Pengguna bisa membaca, menavigasi dengan keyboard, mengunduh file `.md` dan `.pdf`, serta menginstruksikan perubahan spesifik melalui panel revisi.

---

### FASE 7: Repository Governance & Review Automation
**Tujuan:** Menjaga `main` selalu dapat dibangun dan memastikan setiap perubahan melewati pemeriksaan deterministik serta review risiko.

*   **Langkah 1:** Terapkan trunk-based development dengan feature branch berumur pendek.
*   **Langkah 2:** Jalankan TypeScript, seluruh test, dan production build pada GitHub Actions.
*   **Langkah 3:** Gunakan pull request template, branch protection, squash merge, dan automatic Codex review.
*   **Langkah 4:** Simpan aturan repository-specific review pada root `AGENTS.md`.
*   **Kriteria Selesai:** Direct push ke `main` dibatasi, CI menjadi required check, dan PR menerima review sebelum merge.

---

### FASE 8: Mesin "Anti-Slop" Premium (Backend)
**Tujuan:** Memoles kualitas output dokumen agar setara dengan standar SaaS berbayar dengan memotong basa-basi, menghapus jargon AI klise, dan memastikan dokumen sangat teknis dan padat.
*   **Langkah 1:** Definisikan persona `@anti-slop-editor` dan guardrail anti-slop pada `AGENTS.md` dan `app/src/prompts/anti-slop-prompt.ts`.
*   **Langkah 2:** Buat modul pembersih deterministik sintaks-aman di `app/src/lib/anti-slop.ts` yang memuat kamus klise bilingual (EN & ID), proteksi penuh blok ```mermaid``` dan blok kode, serta kalkulator metrik `calculateSlopScore`.
*   **Langkah 3:** Integrasikan direktif anti-slop upstream ke `BASE_INSTRUCTION` pada `app/src/prompts/cop-pipeline.ts` dan prompt revisi `/api/tweak`.
*   **Langkah 4:** Sambungkan sanitasi anti-slop di ujung pipeline `/api/generate/route.ts`, `/api/generate/single/route.ts`, dan `/api/tweak/route.ts`.
*   **Langkah 5:** Buat automated test suite `app/src/__tests__/anti-slop.test.ts` untuk memverifikasi eliminasi slop, proteksi Mermaid, dan zero regression.
*   **Kriteria Selesai:** Seluruh dokumen hasil CoP dan tweak bersih dari klise AI (*delve, seamless, revolutionize, merevolusi, dll*), diagram Mermaid tetap valid, dan 100% test suite lulus.

---

### FASE 9: Migrasi Backend ke Cloudflare Workers & Hono (Edge Architecture)
**Tujuan:** Mengatasi batas waktu eksekusi (timeout) serverless standar dengan memindahkan seluruh pemrosesan LLM, streaming SSE, dan sanitasi dokumen ke edge runtime Cloudflare Workers dengan framework Hono.js, serta menerapkan arsitektur keamanan 5 lapis (*Defense-in-Depth*).

*   **Langkah 1:** Inisialisasi direktori `worker/` sebagai package mandiri dengan Hono.js, TypeScript, dan konfigurasi Wrangler (`wrangler.jsonc`).
*   **Langkah 2:** Pindahkan dan optimalkan seluruh rute LLM ke edge Hono router:
    *   `POST /api/chat`: Onboarding interaktif dan ekstraksi structured output (8 variabel Must-Haves).
    *   `POST /api/generate`: Mesin Chain of Prompts (CoP) dengan streaming Server-Sent Events (SSE) untuk pembentukan dokumen PRD, ARCHITECTURE, dan AGENTS.
    *   `POST /api/generate/single`: Pembuatan dokumen spesifik tunggal secara atomik.
    *   `POST /api/tweak`: Revisi dokumen terisolasi berdasarkan instruksi pengguna.
    *   `GET /health`: Pemeriksaan kesehatan edge worker.
*   **Langkah 3:** Implementasi 5 Lapisan Keamanan (*Defense-in-Depth*):
    *   *Lapisan 1 (Service Auth):* Header `X-Worker-Secret` (`WORKER_SECRET`) untuk memastikan hanya proxy resmi Next.js yang dapat mengakses worker.
    *   *Lapisan 2 (Edge Rate Limiting):* Pembatasan laju IP sliding window (`/api/chat`: 30 req/min, `/api/generate`: 10 req/min, `/api/tweak`: 20 req/min).
    *   *Lapisan 3 (Payload Guard):* Middleware `bodyLimit` maksimal 256KB untuk mencegah eksploitasi memori dan DoS.
    *   *Lapisan 4 (HTTP Security Headers):* Injeksi header OWASP (`nosniff`, `DENY` frame, `strict-origin-when-cross-origin`, HSTS).
    *   *Lapisan 5 (Sanitasi & Anti-Injection):* Pembersihan karakter Unicode tersembunyi (zero-width, RTL override) dan pencegahan prompt injection berbasis regex pattern.
*   **Langkah 4:** Integrasi Next.js Proxy: Konfigurasi `app/next.config.mjs` (rewrites) dan `app/src/middleware.ts` untuk mem-forward header `X-Worker-Secret` secara transparan dari server Next.js ke edge worker tanpa mengubah satu baris pun kode UI di sisi klien.
*   **Langkah 5:** Pengujian Menyeluruh: Unit test worker (10/10 Vitest), test frontend (223/223), serta pengujian E2E otomatis dengan Playwright mencakup 5 alur pengguna utama (Onboarding, Chip Selection, CoP Generation, Markdown Viewer, Document Tweak).
*   **Kriteria Selesai:** Seluruh generasi dokumen berjalan di V8 Isolates tanpa risiko timeout (cold start ~0ms), 5 lapisan keamanan aktif, UI tetap stabil dan responsif, dan 100% automated test suite lulus.
