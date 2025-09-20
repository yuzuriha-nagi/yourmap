import type { Metadata } from "next";
import { Inter, Audiowide } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const audiowide = Audiowide({
  weight: "400",
  variable: "--font-audiowide",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Railytics - 交通インフラ位置追跡",
  description: "リアルタイムで電車・バスの位置と遅延情報を表示",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${audiowide.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
