'use client';

import { create } from 'zustand';
import type { ChatMessage, ChatSession } from '@/types/chat';

interface ChatState {
  session: ChatSession | null;
  messages: ChatMessage[];
  isLoading: boolean;
  isStreaming: boolean;
  streamingText: string;
  setSession: (session: ChatSession) => void;
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  setLoading: (loading: boolean) => void;
  setStreaming: (streaming: boolean) => void;
  setStreamingText: (text: string) => void;
  appendStreamingText: (text: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  session: null,
  messages: [],
  isLoading: false,
  isStreaming: false,
  streamingText: '',
  setSession: (session) => set({ session }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  setLoading: (isLoading) => set({ isLoading }),
  setStreaming: (isStreaming) => set({ isStreaming }),
  setStreamingText: (streamingText) => set({ streamingText }),
  appendStreamingText: (text) =>
    set((state) => ({ streamingText: state.streamingText + text })),
}));
