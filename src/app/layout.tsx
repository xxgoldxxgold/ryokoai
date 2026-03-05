import type { Metadata } from "next";
import Script from "next/script";
import { DM_Sans, Noto_Sans_JP } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "RyokoAI - AI旅行代理店 | 最安値を自動比較",
  description:
    "Agoda、Booking.com、Expediaなど100以上の予約サイトからホテル・航空券の最安値をAIが自動比較。チャットで簡単に旅行プランを作成。",
  openGraph: {
    title: "RyokoAI - AI旅行代理店",
    description: "AIがホテル・航空券の最安値を自動比較",
    url: "https://ryokoai.vercel.app",
    siteName: "RyokoAI",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <Script
          src="https://emrld.ltd/NTA0NTU2.js?t=504556"
          strategy="afterInteractive"
          data-noptimize="1"
          data-cfasync="false"
          data-wpfc-render="false"
        />
      </head>
      <body
        className={`${dmSans.variable} ${notoSansJP.variable} font-sans antialiased bg-[#0a0a0f] text-[#e8e6e1]`}
      >
        {children}
      </body>
    </html>
  );
}
