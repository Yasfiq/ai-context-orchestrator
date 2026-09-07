# Security Policy

## Security Architecture & Defenses

Aplikasi ini menerapkan prinsip *Defense-in-Depth* pada lapisan frontend Next.js dan edge backend Cloudflare Worker:

1. **Service-to-Service Authentication (`WORKER_SECRET`):**
   - Akses API edge dilindungi shared secret header (`X-Worker-Secret`).
   - Hanya proxy server Next.js yang memiliki wewenang memanggil Cloudflare Worker, mencegah akses langsung tanpa izin dari internet publik.
2. **Edge Rate Limiting (IP Throttling):**
   - Pembatasan laju permintaan per IP address (`cf-connecting-ip`):
     - `/api/chat`: Maksimal 30 req/menit.
     - `/api/generate`: Maksimal 10 req/menit.
     - `/api/tweak`: Maksimal 20 req/menit.
   - Header standar `X-RateLimit-*` dan `Retry-After` disertakan pada respons.
3. **Payload Size Guard (`bodyLimit`):**
   - Ukuran request body dibatasi maksimal 256KB untuk mencegah eksploitasi memori dan DoS.
4. **HTTP Security Headers:**
   - Seluruh respons menyertakan header keamanan OWASP (`nosniff`, `DENY` frame, `strict-origin-when-cross-origin`, `Strict-Transport-Security`).
5. **Anti-Prompt Injection & Unicode Sanitization:**
   - Penyaringan pola injeksi (ChatML delimiter, fake system role tags, roleplay jailbreak, evasion mode).
   - Pembersihan otomatis zero-width characters (`\u200B-\u200D`), right-to-left override (`\u202E`), dan karakter kontrol.

## Supported Version

Hanya versi terbaru pada branch `main` yang menerima perbaikan keamanan selama fase eksperimen.

## Reporting

Jangan membuat issue publik untuk kerentanan yang dapat mengekspos kredensial, prompt internal, atau data pengguna.

Gunakan GitHub Private Vulnerability Reporting setelah repository dibuat. Sertakan:

- route atau komponen terdampak;
- langkah reproduksi minimal;
- dampak yang mungkin terjadi;
- bukti bahwa laporan tidak memerlukan kredensial asli.

Jangan menyertakan API key aktif atau data sensitif dalam laporan.
