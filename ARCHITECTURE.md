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
*   **Backend / API Layer:** Next.js Route Handlers (Serverless Functions)
    *   *Alasan:* Mengisolasi eksekusi LLM dan menyembunyikan API keys dengan aman dari browser.
*   **LLM SDK:** Vercel AI SDK
    *   *Alasan:* Menyediakan integrasi provider OpenAI-compatible untuk onboarding, generation, dan revision.

### 2. High-Level System Architecture

```mermaid
graph TD
    Client[Browser / Client] -->|1. Init Session| UI[Editorial Systems Console]
    UI -->|2. Chat Interaction| StateManager[Zustand - 8 Variables State]
    StateManager -->|3. Check Completion| Valid{Are 8 vars filled?}
    Valid -- No --> UI
    Valid -- Yes -->|4. Trigger Generate| API[Next.js API Route / Serverless]
    API -->|5. Chain of Prompts| LLM[OpenAI-compatible LLM Provider]
    LLM -->|6. Raw Documents| AntiSlop[Anti-Slop Engine & Polish Layer]
    AntiSlop -->|7. Polished Documents| API
    API -->|8. Return Stream/JSON| Client
```

### 3. Folder Structure & Data Flow

```text
app/src
 ├── /app
 │    ├── /api
 │    │    ├── /chat            # Endpoint onboarding
 │    │    ├── /generate        # Endpoint penyusunan dokumen
 │    │    └── /tweak           # Endpoint revisi dokumen
 │    ├── page.tsx              # Application shell
 │    └── layout.tsx            # Metadata dan layout utama
 ├── /components
 │    ├── /ui                   # Komponen generik Shadcn
 │    └── /features             # Onboarding, generation, results, reader, revision
 ├── /store
 │    └── useAppStore.ts        # Zustand state (8 variabel Must-Haves & status UI)
 ├── /prompts                   # Direktori prompt instruksi sistem (Strictly Backend)
 │    ├── onboardingPrompt.ts   # Guardrails & sistem ekstraksi 8 variabel
 │    └── copPipeline.ts        # Alur sekuensial generator file .md
 └── /types
      └── schema.ts             # Domain types, labels, dan document state
```

### 4. Data Management & Keamanan
*   **Zero-Persistence:** Data onboarding dan dokumen hanya hidup pada in-memory Zustand store selama tab aktif. Tidak ada database atau persistence lintas sesi.
*   **API Key Isolation:** Kunci API LLM hanya disimpan di environment variables sisi server (`.env.local`), menjamin keamanannya dari injeksi front-end.
*   **Prompt Sanitization:** Input divalidasi dengan ketat sebelum diteruskan ke mesin *Chain of Prompts* untuk meminimalisir Prompt Injection.
