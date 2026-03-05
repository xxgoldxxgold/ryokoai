'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';
import Button from '@/components/ui/Button';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
}

export default function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    // PC: Ctrl+Enter or Cmd+Enter で送信。Enterは改行のみ
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleInput() {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 160) + 'px';
    }
  }

  return (
    <div className="flex items-end gap-2 bg-white/[0.03] border border-white/[0.06] rounded-2xl px-4 py-3">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => { setText(e.target.value); handleInput(); }}
        onKeyDown={handleKeyDown}
        placeholder="どこに行きたいですか？ ✈️"
        rows={1}
        className="flex-1 bg-transparent text-white text-sm placeholder:text-white/30 resize-none focus:outline-none leading-relaxed max-h-40"
        disabled={isLoading}
      />
      <Button
        onClick={handleSend}
        disabled={!text.trim() || isLoading}
        size="sm"
        className="shrink-0 !rounded-xl !px-3"
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
        ) : (
          <Send size={16} />
        )}
      </Button>
    </div>
  );
}
