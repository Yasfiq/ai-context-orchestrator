# RULES.md
## AI Context Orchestrator

Dokumen ini memuat aturan mutlak (*hard rules*) untuk pengembangan web app AI Context Orchestrator. Semua *developer* atau agen AI (**@expert-senior-engineer**, **@backend-llm-specialist**, dll) **WAJIB** mematuhi aturan ini tanpa pengecualian. Pelanggaran terhadap aturan ini harus ditolak dalam proses *Code Review*.

---

### 1. BATASAN RUANG LINGKUP (ANTI SCOPE-CREEP)
- **DILARANG KERAS MENGGUNAKAN DATABASE:** Aplikasi ini 100% *stateless*. Jangan pernah menambahkan Prisma, Drizzle, MongoDB, PostgreSQL, atau Vector Database pada fase MVP. Semua state hanya hidup di memori selama sesi browser aktif.
- **TIDAK ADA SISTEM AUTENTIKASI:** MVP ini adalah *free tools* "pakai-selesai". Dilarang menambahkan NextAuth, Clerk, Firebase Auth, atau fitur *login*/*register* jenis apa pun.
- **TIDAK ADA FITUR HISTORY/RIWAYAT:** Dilarang membuat antarmuka atau logika untuk menyimpan riwayat *prompt* atau dokumen pengguna setelah *tab browser* ditutup.

### 2. ARSITEKTUR & STATE MANAGEMENT
- **Zustand Absolute Rule:** Seluruh manajemen *state* global (khususnya untuk 8 variabel "Must-Haves") wajib menggunakan **Zustand**. Dilarang menggunakan Redux, MobX, atau React Context API untuk *global state* demi menghindari re-render yang tidak perlu.
- **Server Components by Default:** Route dan layout tetap Server Components bila tidak membutuhkan state browser. Feature workspace yang memakai Zustand, input, export, atau rendering interaktif dapat menjadi Client Components pada boundary yang jelas.
- **Isolasi API Key & Backend:** Seluruh pemrosesan LLM (OpenAI-compatible) **WAJIB** berada di backend terisolasi (Cloudflare Workers + Hono di `/worker`, di-proxy oleh Next.js dengan service secret `WORKER_SECRET`). Dilarang keras mengekspos API Key pihak ketiga (`OPENAI_API_KEY`) ke klien atau browser.

### 3. KONVENSI KODE & PENAMAAN (NAMING CONVENTION)
- **Bahasa:** Wajib menggunakan **TypeScript** (`.ts`, `.tsx`). Jangan gunakan JavaScript murni (`.js`, `.jsx`). Set konfigurasi `strict: true` pada `tsconfig.json`.
- **Penamaan File & Direktori:**
  - Gunakan `kebab-case` untuk nama *folder* dan file non-komponen (contoh: `use-app-store.ts`, `api/generate-docs/route.ts`).
  - Gunakan `PascalCase` untuk file komponen React (contoh: `ZenTerminal.tsx`, `ChatBubble.tsx`).
- **Penamaan Variabel & Fungsi:** Gunakan `camelCase` (contoh: `handleGenerateDocs`, `isProcessing`).
- **Tipe Data & Interface:** Gunakan `PascalCase` dengan awalan opsional, tapi lebih disarankan tanpa awalan `I` (contoh: `ProjectState`, bukan `IProjectState`).

### 4. STYLING & UI/UX
- **UI Framework:** Wajib menggunakan **Tailwind CSS** dan local Shadcn-style primitives. Dilarang menambahkan Material UI, Chakra UI, Ant Design, atau component library lain. Custom CSS diperbolehkan untuk design tokens, Markdown/Mermaid reader, print, accessibility, dan browser behavior yang tidak efektif ditulis sebagai utility.
- **Palet Warna Inti:** Identitas utama menggunakan warna berikut untuk Editorial Systems Console:
  - *Background Utama:* `Deep Charcoal` (`#121619`)
  - *Aksen/Tombol Aktif:* `Cobalt Blue` (`#4338CA`)
  - *Indikator Sukses:* `Emerald Green` (`#10B981`)
  - *Teks Utama:* `Off-White` (`#E2E8F0`)
- Warna semantik tambahan hanya boleh dipakai untuk error, warning, focus, dan status yang memiliki label tekstual.
- **Animasi Minimalis:** Hindari animasi transisi yang rumit. Gunakan efek *fade* atau *slide* ringan bawaan Tailwind agar *performa* tetap maksimal dan UI terasa *snappy*.

### 5. KEAMANAN & GUARDRAILS (LLM)
- **Validasi Input Keras:** Semua *input text* dari sisi *client* wajib divalidasi dan di-sanitasi sebelum masuk ke *pipeline Chain of Prompts*. 
- **Penolakan Ilegal (Hard Block):** Jika input mencoba mengambil kredensial, mengubah system prompt, atau melewati guardrail, hentikan request dan tampilkan pesan Indonesia yang relevan tanpa mengungkap aturan internal.

### 6. PENGELOLAAN ERROR (ERROR HANDLING)
- Jangan pernah membiarkan aplikasi *crash* (layar putih/Blank Screen of Death). Selalu gunakan `error.tsx` bawaan Next.js App Router di setiap segmen *route*.
- Tangani timeout, offline state, rate limit, dan partial generation dengan recovery action yang spesifik. Gunakan komponen notifikasi lokal dan jangan mengekspos pesan teknis provider.
