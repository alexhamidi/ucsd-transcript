import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UCSD Transcript Extractor",
  description: "Extract transcripts from UCSD lecture videos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-black text-white">{children}</body>
    </html>
  );
}
