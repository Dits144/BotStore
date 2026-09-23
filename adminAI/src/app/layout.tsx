import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DitsStore AI Admin — AI-Powered WhatsApp Customer Service",
  description: "Production-grade WhatsApp AI Customer Service & Management Platform for DitsStore",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased overflow-x-hidden min-h-screen">
        {children}
      </body>
    </html>
  );
}
