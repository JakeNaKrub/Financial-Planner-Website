import type { Metadata } from "next";
import "./globals.css";


export const metadata: Metadata = {
  title: "FinTrack",
  description: "Plan, split, and share travel expenses.",
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
