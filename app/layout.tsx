import type { Metadata, Viewport } from "next";
import { Inter, Anton, Doto, Space_Mono } from "next/font/google";
import "./globals.css";
import "./themes.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-anton",
  display: "swap",
});

const doto = Doto({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-doto",
  display: "swap",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Complex Daily · A Culture Quiz",
  description:
    "Five questions. One shot. Know the culture. Prove it daily.",
  metadataBase: new URL("https://complex-receipts.vercel.app"),
  openGraph: {
    title: "Complex Daily · A Culture Quiz",
    description: "Five questions. One shot. Prove you know the culture.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0F",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${anton.variable} ${doto.variable} ${spaceMono.variable}`}
      data-theme="3"
      suppressHydrationWarning
    >
      <body>{children}</body>
    </html>
  );
}
