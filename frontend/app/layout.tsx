import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "wpm_pacer",
  description:
    "Read English text at a chosen words-per-minute pace with progressive highlighting.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
