import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import './globals.css';

export const metadata: Metadata = {
  title: 'RyokoAI - ホテル最安値を国別比較で見つける',
  description: '同じホテルでもアクセスする国によって料金が変わる。RyokoAIは18カ国の予約リンクを一覧生成し、最安値を見つけるお手伝いをします。',
  openGraph: {
    title: 'RyokoAI - ホテル最安値を国別比較で見つける',
    description: '同じホテルでもアクセスする国によって料金が変わる。18カ国の予約リンクを比較して最安値で予約しよう。',
    siteName: 'RyokoAI',
    locale: 'ja_JP',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 pt-14">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
