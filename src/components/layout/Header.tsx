'use client';

import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import Button from '@/components/ui/Button';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-gold">
          RyokoAI
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/chat" className="text-white/70 hover:text-white transition-colors text-sm">
            Chat
          </Link>
          <Link href="/plans" className="text-white/70 hover:text-white transition-colors text-sm">
            My Plans
          </Link>
          <Link href="/auth/login">
            <Button variant="secondary" size="sm">Log in</Button>
          </Link>
          <Link href="/chat">
            <Button size="sm">Start Planning</Button>
          </Link>
        </nav>

        <button
          className="md:hidden text-white/70"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-[#0a0a0f] border-b border-white/[0.06] px-4 pb-4">
          <nav className="flex flex-col gap-3">
            <Link href="/chat" className="text-white/70 hover:text-white py-2" onClick={() => setMenuOpen(false)}>
              Chat
            </Link>
            <Link href="/plans" className="text-white/70 hover:text-white py-2" onClick={() => setMenuOpen(false)}>
              My Plans
            </Link>
            <Link href="/auth/login" onClick={() => setMenuOpen(false)}>
              <Button variant="secondary" size="sm" className="w-full">Log in</Button>
            </Link>
            <Link href="/chat" onClick={() => setMenuOpen(false)}>
              <Button size="sm" className="w-full">Start Planning</Button>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
