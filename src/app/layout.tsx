import type { Metadata } from "next";
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
  title: "RyokoAI - AI Travel Agent | Find the Best Deals",
  description:
    "Compare hotel and flight prices across Agoda, Booking.com, Expedia and 100+ sites. AI-powered travel planning for free.",
  openGraph: {
    title: "RyokoAI - AI Travel Agent",
    description: "Find the best travel deals with AI",
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
    <html lang="en">
      <body
        className={`${dmSans.variable} ${notoSansJP.variable} font-sans antialiased bg-[#0a0a0f] text-[#e8e6e1]`}
      >
        {children}
      </body>
    </html>
  );
}
