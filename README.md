# AI Context Orchestrator

Ruang kerja berbasis AI untuk mematangkan konteks proyek sebelum implementasi. Onboarding menguji asumsi pengguna secara bertahap, lalu menyusun tujuh dokumen proyek yang saling konsisten.

## Kemampuan Utama

- **Deep onboarding** — menggali delapan keputusan proyek tanpa menerima jawaban ambigu secara otomatis.
- **Recommendation provenance** — membedakan jawaban manual dari rekomendasi AI pada setiap turn.
- **Sequential document generation** — menyusun dokumen satu per satu dengan progress dan retry per tahap.
- **Document revision** — memperbarui dokumen melalui arahan natural language dengan dukungan undo dan stale state.
- **Markdown dan Mermaid** — membaca tabel, kode, serta diagram `flowchart`, `graph`, `sequenceDiagram`, dan `gitGraph`.
- **Export** — mengunduh Markdown individual, dokumen gabungan, atau PDF.
- **Editorial Systems Console** — interface responsif dengan state aksesibel dan copy user-facing yang konsisten.

## Dokumen yang Dihasilkan

1. `PRD.md`
2. `ARCHITECTURE.md`
3. `AGENTS.md`
4. `RULES.md`
5. `WORKFLOW.md`
6. `SKILLS_MATRIX.md`
7. `IMPLEMENTATION_PLAN.md`

## Tech Stack

- Next.js 14 App Router
- TypeScript
- Tailwind CSS dan komponen lokal bergaya Shadcn
- Zustand
- Vercel AI SDK dengan provider OpenAI-compatible
- Vitest dan Testing Library

## Menjalankan Secara Lokal

### Prasyarat

- Node.js sesuai versi dalam `app/.nvmrc`
- npm
- API key dari provider LLM yang kompatibel

### Instalasi

```bash
cd app
nvm use
npm ci
cp .env.local.example .env.local
```

Isi `.env.local` dengan konfigurasi provider Anda. Jangan commit file tersebut.

```dotenv
LLM_API_KEY=your-api-key
LLM_BASE_URL=https://provider.example/v1
LLM_MODEL_NAME=model-name
LLM_CHAT_MODEL_NAME=chat-model-name
LLM_DOCUMENT_MODEL_NAME=document-model-name
LLM_TWEAK_MODEL_NAME=tweak-model-name
```

Jalankan development server:

```bash
npm run dev
```

Buka `http://localhost:3000`.

## Verifikasi

Jalankan dari direktori `app`:

```bash
npm run typecheck
npm run test:run
npm run build
```

Seluruh pemeriksaan juga dapat dijalankan melalui:

```bash
npm run verify
```

CI menjalankan pemeriksaan yang sama untuk setiap pull request menuju `main`.

## Struktur Proyek

```text
app/src/
├── app/                 # Pages dan Route Handlers
├── components/
│   ├── features/        # Onboarding, generation, reader, dan revision
│   └── ui/              # UI primitives
├── lib/                 # Sanitization, parsing, export, dan utilities
├── prompts/             # Onboarding dan document-generation prompts
├── store/               # Zustand state
├── types/               # Schema dan domain types
└── __tests__/           # Unit dan component tests
```

## Security Boundaries

- API key hanya dibaca di server melalui Route Handlers.
- Input user disanitasi dan diperiksa terhadap prompt injection.
- Client tidak menerima system prompt atau error provider mentah.
- `.env.local`, output build, dependencies, dan TypeScript build cache diabaikan Git.

Lihat kebijakan lengkap pada `SECURITY.md`.

## Git Workflow

Gunakan feature branch berumur pendek, buka pull request ke `main`, tunggu CI dan AI review, lalu lakukan squash merge.

Panduan lengkap tersedia di `CONTRIBUTING.md`. Prinsip UI tersedia di `app/UI_PRINCIPLES.md`.

## Deployment

Application dapat dideploy ke platform yang mendukung Next.js Route Handlers, seperti Vercel. Daftarkan seluruh variabel `LLM_*` sebagai environment variables pada platform deployment dan jangan menaruh nilainya di source code.

## License

Private — All rights reserved.
