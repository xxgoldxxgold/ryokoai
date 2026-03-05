'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function NewChatPage() {
  const router = useRouter();

  useEffect(() => {
    // Generate a new session ID and redirect
    const id = crypto.randomUUID();
    router.replace(`/chat/${id}`);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-gold/40 rounded-full animate-bounce" />
        <div className="w-2 h-2 bg-gold/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-gold/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}
