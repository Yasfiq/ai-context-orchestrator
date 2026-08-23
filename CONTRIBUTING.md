# Contributing

## Branching Model

Repository ini menggunakan trunk-based development dengan branch berumur pendek.

- `main` selalu dalam kondisi dapat dibangun dan menjadi satu-satunya branch permanen.
- Gunakan `feat/<nama>`, `fix/<nama>`, `refactor/<nama>`, atau `docs/<nama>`.
- Jangan push langsung ke `main` setelah branch protection diaktifkan.

Contoh:

```bash
git switch main
git pull --ff-only
git switch -c feat/editorial-ui-revamp
```

## Commit

Gunakan Conventional Commits dan simpan satu tujuan utama per commit.

```text
feat(onboarding): add contextual recommendation options
fix(generation): resume from the failed document
refactor(ui): introduce editorial workspace tokens
test(mermaid): cover malformed diagram recovery
docs(workflow): document pull request policy
```

Stage perubahan secara selektif dan periksa ulang sebelum commit:

```bash
git add -p
git diff --staged
git commit -m "type(scope): concise outcome"
```

Test harus berada dalam commit yang sama dengan behavior yang diuji agar setiap commit tetap valid.

## Local Verification

Jalankan dari direktori `app`:

```bash
npm run typecheck
npm run test:run
npm run build
```

Atau jalankan seluruhnya:

```bash
npm run verify
```

## Pull Requests

1. Buka Draft PR sejak awal agar scope terlihat.
2. Isi bagian perubahan, cara verifikasi, dan risiko.
3. Tunggu CI lulus.
4. Jalankan `@codex review` dan evaluasi setiap finding berdasarkan bukti.
5. Minta human review untuk perubahan berisiko tinggi jika tersedia.
6. Selesaikan seluruh conversation sebelum merge.
7. Gunakan squash merge dan hapus feature branch.

AI review merupakan lapisan tambahan. Test, CI, branch protection, dan penilaian manusia tetap menjadi sumber keputusan merge.

## Security

- Jangan commit `.env.local` atau kredensial provider.
- Jangan mengirim raw system prompt, stack trace, atau pesan provider kepada client.
- Jangan menonaktifkan sanitization untuk melewati test.
- Laporkan kerentanan melalui GitHub Private Vulnerability Reporting, bukan issue publik.
