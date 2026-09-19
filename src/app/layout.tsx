import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Milemark · Travel expenses",
  description: "Frictionless travel expense capture.",
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
