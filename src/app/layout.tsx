import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import './globals.css';

export const metadata: Metadata = {
  other: {
    'agd-partner-manual-verification': '',
  },
  title: 'RyokoAI - ホテル最安値を国別・OTA別に比較 | 同じホテルを最大25%安く',
  description: '同じホテルでもOTAや国によって価格が最大25%違います。RyokoAIで18カ国×複数OTAの価格を一括比較。Agoda, Booking.com, Expedia, Hotels.comの最安値を見つけよう。',
  openGraph: {
    title: 'RyokoAI - ホテル最安値を国別・OTA別に比較',
    description: '同じホテルでもOTAや国によって価格が最大25%違います。18カ国×複数OTAの価格を一括比較して最安値で予約しよう。',
    siteName: 'RyokoAI',
    locale: 'ja_JP',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="min-h-screen flex flex-col overflow-x-hidden">
        <Header />
        <main className="flex-1 pt-14">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
