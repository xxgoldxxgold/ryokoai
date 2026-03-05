'use client';

import { useEffect, useRef } from 'react';
import UserMessage from './UserMessage';
import AssistantMessage from './AssistantMessage';
import Avatar from '@/components/ui/Avatar';
import type { ChatMessage } from '@/types/chat';

interface ChatMessagesProps {
  messages: ChatMessage[];
  streamingText: string;
  isStreaming: boolean;
}

export default function ChatMessages({ messages, streamingText, isStreaming }: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
      {messages.map((msg) =>
        msg.role === 'user' ? (
          <UserMessage key={msg.id} content={msg.content} />
        ) : (
          <AssistantMessage key={msg.id} message={msg} />
        )
      )}

      {isStreaming && streamingText && (
        <div className="flex gap-3">
          <Avatar isAI className="shrink-0 mt-1" />
          <div className="max-w-[80%] md:max-w-[70%]">
            <div className="bg-white/[0.03] border border-white/[0.06] text-white/90 rounded-2xl rounded-tl-md px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap">
              {streamingText}
              <span className="inline-block w-1.5 h-4 bg-gold/60 ml-0.5 animate-pulse" />
            </div>
          </div>
        </div>
      )}

      {isStreaming && !streamingText && (
        <div className="flex gap-3">
          <Avatar isAI className="shrink-0 mt-1" />
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl rounded-tl-md px-4 py-3">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-gold/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-gold/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-gold/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
