## Perubahan

Jelaskan masalah yang diselesaikan dan keputusan utama dalam implementasi ini.

## Cara Verifikasi

Tuliskan langkah manual yang diperlukan selain pemeriksaan CI.

## Risiko

Sebutkan state, route, atau perilaku lama yang paling mungkin terkena regression.

## Checklist

- [ ] Scope PR tetap fokus dan tidak membawa perubahan yang tidak berkaitan.
- [ ] `npm run typecheck` lulus.
- [ ] `npm run test:run` lulus.
- [ ] `npm run build` lulus.
- [ ] Tidak ada API key, `.env.local`, output build, atau data sensitif yang ikut masuk.
- [ ] Perubahan UI diperiksa pada desktop dan mobile serta dapat digunakan dengan keyboard.
- [ ] Copy user-facing konsisten dengan bahasa sesi dan tidak mengekspos error internal.
- [ ] Test ditambahkan atau diperbarui untuk behavior yang berubah.

## Review AI

Setelah PR siap, jalankan:

```text
@codex review
```

Untuk perubahan pada autentikasi, kredensial, sanitization, atau Route Handlers:

```text
@codex security review
```
