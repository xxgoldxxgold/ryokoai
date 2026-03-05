'use client';

import Link from 'next/link';
import { MessageSquare, Plus } from 'lucide-react';

interface SidebarProps {
  sessions?: { id: string; title: string }[];
  currentSessionId?: string;
}

export default function Sidebar({ sessions = [], currentSessionId }: SidebarProps) {
  return (
    <aside className="hidden lg:flex flex-col w-64 bg-[#0a0a0f] border-r border-white/[0.06] h-[calc(100vh-64px)]">
      <div className="p-4">
        <Link
          href="/chat"
          className="flex items-center gap-2 px-4 py-2.5 bg-gold/10 text-gold rounded-xl hover:bg-gold/20 transition-colors text-sm font-medium w-full"
        >
          <Plus size={16} />
          New Chat
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-2">
        {sessions.map((session) => (
          <Link
            key={session.id}
            href={`/chat/${session.id}`}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors mb-0.5 ${
              session.id === currentSessionId
                ? 'bg-white/5 text-white'
                : 'text-white/50 hover:bg-white/[0.03] hover:text-white/70'
            }`}
          >
            <MessageSquare size={14} className="shrink-0" />
            <span className="truncate">{session.title}</span>
          </Link>
        ))}
      </div>
    </aside>
  );
}
