import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Hero from '@/components/landing/Hero';
import Features from '@/components/landing/Features';

export default function Home() {
  return (
    <>
      <Header />
      <main className="pt-16">
        <Hero />
        <Features />
      </main>
      <Footer />
    </>
  );
}
