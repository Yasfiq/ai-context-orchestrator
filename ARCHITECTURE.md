# ARCHITECTURE.md
## AI Context Orchestrator

Dokumen ini memuat arsitektur high-level, stack teknologi, serta konvensi struktural untuk web aplikasi AI Context Orchestrator.

### 1. Technology Stack
Berdasarkan kebutuhan MVP (stateless, performa cepat, Editorial Systems Console, dan keamanan API), berikut stack yang digunakan:

*   **Frontend Framework:** Next.js (App Router)
    *   *Alasan:* Mendukung arsitektur server/client yang modern, routing mudah, dan ekosistem React yang matang.
*   **Styling & UI Components:** Tailwind CSS + local Shadcn-style primitives
    *   *Alasan:* Token visual, state aksesibel, Markdown reader, dan layout responsif dapat dikendalikan tanpa menambah component library baru.
*   **State Management:** Zustand
    *   *Alasan:* Ringan, boilerplate minimal. Sangat cocok untuk mengelola 8 variabel "Must-Haves" selama sesi berjalan di klien.
*   **Backend / API Layer:** Cloudflare Workers + Hono.js (dengan fallback legacy Next.js Route Handlers)
    *   *Alasan:* Berjalan di edge V8 Isolates dengan cold-start ~0ms, mendukung long HTTP streaming SSE tanpa terbentur batas waktu serverless standard (10s–15s), serta konsumsi resource ultra-efisien.
*   **LLM SDK:** Vercel AI SDK (`ai` & `@ai-sdk/openai`)
    *   *Alasan:* Menyediakan integrasi provider OpenAI-compatible untuk onboarding, generation, dan revision.

### 2. High-Level System Architecture

```mermaid
graph TD
    Client[Browser / Client] -->|1. Init Session| UI[Editorial Systems Console]
    UI -->|2. Chat Interaction| StateManager[Zustand - 8 Variables State]
    StateManager -->|3. Check Completion| Valid{Are 8 vars filled?}
    Valid -- No --> UI
    Valid -- Yes -->|4. Trigger Generate| API[Cloudflare Worker / Hono API]
    API -->|5. Chain of Prompts| LLM[OpenAI-compatible LLM Provider]
    LLM -->|6. Raw Documents| AntiSlop[Anti-Slop Engine & Polish Layer]
    AntiSlop -->|7. Polished Documents| API
    API -->|8. Return Stream/JSON| Client
```

### 3. Folder Structure & Data Flow

```text
├── app/src
│    ├── /app
│    │    ├── /api              # [Legacy Fallback] Endpoint Next.js
│    │    ├── page.tsx          # Application shell
│    │    └── layout.tsx        # Metadata dan layout utama
│    ├── /components           # UI components & Markdown reader
│    ├── /store                # Zustand state (8 variabel Must-Haves & UI status)
│    └── /types                # Shared domain types
├── worker/                    # [Production API] Cloudflare Workers + Hono
│    ├── wrangler.jsonc        # Konfigurasi Cloudflare Worker & bindings
│    ├── src/
│    │    ├── index.ts         # Hono entry point, CORS, & health check
│    │    ├── routes/          # /api/chat, /api/generate, /api/tweak
│    │    ├── lib/             # LLM provider, sanitizer, parser, anti-slop
│    │    └── prompts/         # Onboarding & CoP prompt pipeline
│    └── ...
```

### 4. Data Management & Keamanan
*   **Zero-Persistence:** Data onboarding dan dokumen hanya hidup pada in-memory Zustand store selama tab aktif. Tidak ada database atau persistence lintas sesi.
*   **API Key Isolation:** Kunci API LLM hanya disimpan di environment variables sisi server (`.env.local`), menjamin keamanannya dari injeksi front-end.
*   **Prompt Sanitization:** Input divalidasi dengan ketat sebelum diteruskan ke mesin *Chain of Prompts* untuk meminimalisir Prompt Injection.
