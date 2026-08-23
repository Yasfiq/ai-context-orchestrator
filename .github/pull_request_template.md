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

Workflow `AI Code Review` melalui 9Router berjalan otomatis ketika PR tidak lagi berstatus Draft. Pastikan komentar review terbaru sudah dievaluasi sebelum merge.

Jika workflow tidak berjalan, periksa repository secret `NINEROUTER_KEY` serta repository variables `NINEROUTER_URL` dan `NINEROUTER_MODEL` pada pengaturan GitHub Actions.
