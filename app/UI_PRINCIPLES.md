# UI Principles

## Editorial Systems Console

- Setiap garis, indeks, warna, dan animasi harus menjelaskan struktur atau status.
- Cobalt menandai keputusan atau tindakan aktif. Emerald hanya menandai hasil terkonfirmasi.
- Gunakan grouping berdasarkan hubungan informasi, bukan kartu untuk setiap elemen.
- Tulis copy yang tenang, spesifik, dan jujur. Hindari hype, emoji, status palsu, dan simulasi proses internal AI.
- Bedakan informasi dari pengguna, rekomendasi AI, asumsi, proses, kegagalan, dan hasil terkonfirmasi.
- Pertahankan target sentuh minimal 44px, focus yang terlihat, dan jangan mengandalkan warna saja.
- Semua state asinkron harus menjelaskan apa yang sedang terjadi dan menyediakan pemulihan saat gagal.

## Component Rules

- Hindari radius berbentuk pill kecuali kontrol benar-benar mewakili filter atau status ringkas.
- Gunakan `Button`, `Input`, dan `Textarea` bersama state bawaan; jangan membuat style satu kali tanpa alasan struktural.
- Gunakan ikon Lucide dengan label aksesibel. Jangan gunakan karakter emoji sebagai ikon.
- Desktop rail dan mobile switcher harus memakai state dan semantik dokumen yang sama.

## Copy Rules

- Bahasa antarmuka utama adalah bahasa Indonesia.
- Istilah teknis Inggris dapat dipakai jika merupakan nama artefak atau lebih lazim bagi pengguna teknis.
- Jangan menampilkan error mentah dari server sebagai pesan utama kepada pengguna.
- Hindari: `smart`, `magic`, `seamless`, `enabled`, `online`, dan klaim sukses sebelum aksi terkonfirmasi.
