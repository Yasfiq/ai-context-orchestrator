export default function Loading() {
  return (
    <main className="workspace-frame flex min-h-[100dvh] items-center justify-center px-6">
      <div className="w-full max-w-xl" role="status" aria-live="polite">
        <p className="eyebrow">AI Context Orchestrator</p>
        <h1 className="mt-3 text-2xl font-semibold text-foreground">Menyiapkan ruang konteks</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Memuat keputusan proyek dan status dokumen terakhir.
        </p>
        <div className="mt-8 h-px overflow-hidden bg-border" aria-hidden="true">
          <div className="h-full w-1/3 animate-progress-scan bg-primary" />
        </div>
      </div>
    </main>
  );
}
