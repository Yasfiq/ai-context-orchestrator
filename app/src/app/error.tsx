"use client";

import { Button } from "@/components/ui/Button";
import { CircleAlert, RefreshCw, RotateCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="workspace-frame flex min-h-[100dvh] items-center justify-center p-6">
      <div className="w-full max-w-xl border-l-2 border-destructive pl-6">
        <CircleAlert className="h-6 w-6 text-destructive" aria-hidden="true" />
        <p className="eyebrow mt-6">Sistem / Gangguan</p>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">
          Ruang kerja belum dapat dibuka
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Terjadi gangguan saat memuat halaman. Coba buka kembali state terakhir atau muat ulang aplikasi.
        </p>
        {error.digest && (
          <p className="mt-4 font-mono text-[10px] text-muted-foreground">
            Referensi: {error.digest}
          </p>
        )}
        <div className="mt-7 flex flex-wrap gap-3">
          <Button onClick={reset} variant="default">
            <RotateCw className="h-4 w-4" aria-hidden="true" />
            Buka kembali
          </Button>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Muat ulang halaman
          </Button>
        </div>
      </div>
    </main>
  );
}
