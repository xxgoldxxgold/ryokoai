'use client';

import { useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import ChatMessages from '@/components/chat/ChatMessages';
import ChatInput from '@/components/chat/ChatInput';
import type { ChatMessage } from '@/types/chat';

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  session_id: '',
  role: 'assistant',
  content:
    "Hi! I'm RyokoAI, your AI travel agent. I'll help you find the best travel deals by comparing prices across 100+ booking sites.\n\nWhere would you like to go? Tell me about your dream trip!",
  metadata: {},
  created_at: new Date().toISOString(),
};

export default function ChatSessionPage() {
  const params = useParams();
  const sessionId = params.id as string;

  const [messages, setMessages] = useState<ChatMessage[]>([
    { ...WELCOME_MESSAGE, session_id: sessionId },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');

  const sendMessage = useCallback(
    async (text: string) => {
      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        session_id: sessionId,
        role: 'user',
        content: text,
        metadata: {},
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);
      setIsStreaming(true);
      setStreamingText('');

      try {
        const allMessages = [...messages, userMsg]
          .filter((m) => m.id !== 'welcome')
          .map((m) => ({ role: m.role, content: m.content }));

        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: allMessages, session_id: sessionId }),
        });

        if (!res.ok) throw new Error('Chat request failed');

        const reader = res.body?.getReader();
        if (!reader) throw new Error('No reader');

        const decoder = new TextDecoder();
        let fullText = '';
        let metadata: Record<string, unknown> = {};

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.type === 'text') {
                fullText += parsed.content;
                setStreamingText(fullText);
              } else if (parsed.type === 'metadata') {
                metadata = parsed.data || {};
              } else if (parsed.type === 'tool_result') {
                if (parsed.tool === 'search_hotels') {
                  metadata.hotels = parsed.data;
                } else if (parsed.tool === 'search_flights') {
                  metadata.flights = parsed.data;
                }
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }

        const assistantMsg: ChatMessage = {
          id: crypto.randomUUID(),
          session_id: sessionId,
          role: 'assistant',
          content: fullText,
          metadata: metadata as ChatMessage['metadata'],
          created_at: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, assistantMsg]);
      } catch (error) {
        const errorMsg: ChatMessage = {
          id: crypto.randomUUID(),
          session_id: sessionId,
          role: 'assistant',
          content: 'Sorry, something went wrong. Please try again.',
          metadata: {},
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
        setIsStreaming(false);
        setStreamingText('');
      }
    },
    [messages, sessionId]
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex flex-col pt-16 max-w-4xl mx-auto w-full">
        <ChatMessages
          messages={messages}
          streamingText={streamingText}
          isStreaming={isStreaming}
        />
        <div className="p-4 pb-6">
          <ChatInput onSend={sendMessage} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
