# AI Context Orchestrator

Ruang kerja berbasis AI untuk mematangkan konteks proyek sebelum implementasi. Onboarding menguji asumsi pengguna secara bertahap, lalu menyusun dokumen spesifikasi proyek yang saling konsisten dengan performa edge tanpa batas serverless timeout.

## Kemampuan Utama

- **Deep Onboarding** — Menggali delapan keputusan proyek (*8 Must-Haves*) tanpa menerima jawaban ambigu secara otomatis.
- **Recommendation Provenance** — Membedakan jawaban manual dari rekomendasi AI pada setiap turn onboarding.
- **Edge Backend (Cloudflare Workers + Hono)** — Bebas dari batasan timeout serverless tradisional dengan streaming HTTP (SSE) murni di atas runtime V8 Isolates.
- **Sequential Document Generation** — Menyusun dokumen satu per satu dengan progress real-time dan retry per tahap.
- **Document Revision (Conversational Tweak)** — Memperbarui dokumen melalui arahan natural language dengan dukungan undo dan status *stale dependency*.
- **Markdown dan Mermaid** — Membaca tabel, kode, serta diagram visual `flowchart`, `graph`, `sequenceDiagram`, dan `gitGraph`.
- **Ekspor Dokumen** — Mengunduh Markdown individual (`.md`), dokumen gabungan, bundle ZIP, atau PDF.
- **Defense-in-Depth Security** — Dilengkapi autentikasi internal antar-service (`WORKER_SECRET`), edge rate limiting (IP throttling), body size limit (256KB), security headers OWASP, dan anti-prompt injection.

## Dokumen yang Dihasilkan

1. `PRD.md` (Product Requirements Document)
2. `ARCHITECTURE.md` (System & Technical Architecture)
3. `AGENTS.md` (AI Agent Personas & Governance)

## Tech Stack

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Shadcn UI primitives, Zustand
- **Backend / Edge:** Cloudflare Workers, Hono.js, Vercel AI SDK (`ai` & `@ai-sdk/openai`)
- **Testing & Tooling:** Vitest, Playwright, Wrangler CLI

## Struktur Monorepo

```text
├── app/                          # Frontend Next.js (App Router)
│    ├── src/
│    │    ├── app/                # Pages, layout, dan rewrite proxy
│    │    ├── components/         # UI components & features (ZenTerminal, ResultsView)
│    │    ├── hooks/              # Custom hooks
│    │    ├── lib/                # Utilities, sanitization, export helpers
│    │    ├── store/              # Zustand global state (8 Must-Haves)
│    │    └── types/              # TypeScript schema
│    └── ...
├── worker/                       # Backend Cloudflare Workers + Hono
│    ├── src/
│    │    ├── index.ts            # Hono app, security headers, rate limiting, CORS
│    │    ├── routes/             # Endpoint: /api/chat, /api/generate, /api/tweak
│    │    ├── lib/                # Rate limiter, LLM provider, sanitizer, anti-slop
│    │    └── prompts/            # Onboarding & CoP generation prompts
│    ├── wrangler.jsonc           # Konfigurasi Cloudflare Worker
│    └── ...
└── package.json                  # Monorepo task orchestration scripts
```

## Menjalankan Secara Lokal

### 1. Prasyarat
- Node.js `>=20.17.0` (disarankan Node v24 LTS)
- npm
- Provider LLM OpenAI-compatible (OpenAI, Groq, 9router, Ollama, dll)

### 2. Setup Environment

**A. Backend Worker (`worker/.dev.vars`):**
```bash
cd worker
cp .dev.vars.example .dev.vars
```
Isi variabel berikut:
```ini
LLM_API_KEY="your-api-key"
LLM_BASE_URL="https://api.openai.com/v1" # atau http://127.0.0.1:20128/v1 untuk 9router
LLM_MODEL_NAME="gpt-4o"
ALLOWED_ORIGINS="http://localhost:3000"
```

**B. Frontend Next.js (`app/.env.local`):**
```bash
cd ../app
cp .env.local.example .env.local
```
Pastikan `WORKER_API_URL` mengarah ke worker lokal:
```ini
WORKER_API_URL="http://localhost:8787"
```

### 3. Menjalankan Aplikasi

Dari root direktori project, Anda dapat menjalankan keduanya dengan script berikut:

```bash
# Terminal 1: Jalankan Cloudflare Worker API (:8787)
npm run dev:worker

# Terminal 2: Jalankan Frontend Next.js (:3000)
npm run dev:app
```

Buka browser di `http://localhost:3000`.

## Pengujian & Verifikasi

Jalankan pemeriksaan typecheck dan seluruh test suite langsung dari root:

```bash
# Jalankan seluruh test (Worker unit test + Frontend component test)
npm run test:all

# Jalankan TypeScript typecheck untuk seluruh project
npm run typecheck:all
```

## Deployment ke Production

1. **Deploy Backend (Cloudflare Workers):**
   ```bash
   cd worker
   # Simpan secrets di Cloudflare
   npx wrangler secret put LLM_API_KEY
   npx wrangler secret put ALLOWED_ORIGINS   # misal: https://app-anda.vercel.app
   npx wrangler secret put WORKER_SECRET     # Token rahasia internal

   # Deploy worker
   npm run deploy
   ```
2. **Deploy Frontend (Vercel / Cloudflare Pages):**
   Tambahkan environment variables pada dashboard hosting:
   * `WORKER_API_URL`: URL publik worker Anda (`https://ai-context-orchestrator-api.<subdomain>.workers.dev`).
   * `WORKER_SECRET`: Token yang sama persis dengan yang diset di Cloudflare Worker.

## Security Architecture

Lihat panduan lengkap pada [SECURITY.md](SECURITY.md) untuk detail 5 lapisan keamanan (*Defense-in-Depth*).

## License

Private — All rights reserved.
