import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Product List Scraper",
  description: "Scrape and manage product lists from e-commerce platforms",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
