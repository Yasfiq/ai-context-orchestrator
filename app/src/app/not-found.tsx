import Link from "next/link";
import { ArrowLeft, FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <main className="workspace-frame flex min-h-[100dvh] items-center justify-center p-6">
      <div className="w-full max-w-xl border-l border-border pl-6">
        <FileQuestion className="h-6 w-6 text-indigo-300" aria-hidden="true" />
        <p className="eyebrow mt-6">404 / Rute tidak ditemukan</p>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">Halaman ini tidak tersedia</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Alamat yang dibuka tidak mengarah ke bagian aktif dari ruang kerja proyek.
        </p>
        <Link
          href="/"
          className="mt-7 inline-flex min-h-11 items-center gap-2 border border-primary bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-600 focus-visible:outline-none"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Kembali ke ruang kerja
        </Link>
      </div>
    </main>
  );
}
