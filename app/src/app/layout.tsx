import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Context Orchestrator",
  description:
    "Ruang kerja untuk mematangkan konteks proyek dan menyusun dokumen implementasi yang konsisten.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="dark">
      <body className="min-h-[100dvh] bg-background font-sans text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
