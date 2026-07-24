import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Benzresin | Bespoke Handcrafted Furniture",
  description: "One-of-a-kind handcrafted dining tables using solid wood and epoxy resin. Made for your space.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <body className="min-h-[100dvh] flex flex-col font-sans bg-ivory text-black selection:bg-gold selection:text-black">
        <main className="flex-grow flex flex-col">{children}</main>
      </body>
    </html>
  );
}
