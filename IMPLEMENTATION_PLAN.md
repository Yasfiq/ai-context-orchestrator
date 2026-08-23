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
