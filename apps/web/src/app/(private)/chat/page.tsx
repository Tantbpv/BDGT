'use client';

import type { ChatMessage } from '@repo/contracts/ai';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { useSendMessage } from '@/features/chat/hooks/useChat';

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState<string | undefined>();
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasSentPrefillRef = useRef(false);
  const { mutate: sendMessage, isPending } = useSendMessage();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    const PADDING_Y_DIFF = 10;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight + PADDING_Y_DIFF}px`;
  }, [input]);

  useEffect(() => {
    const prefill = searchParams.get('message');
    if (!prefill || hasSentPrefillRef.current) return;
    hasSentPrefillRef.current = true;
    submitMessage(prefill);
    router.replace(pathname, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function submitMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isPending) return;

    setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);
    setInput('');

    sendMessage(
      { message: trimmed, conversationId },
      {
        onSuccess(data) {
          console.log(data);
          setConversationId(data.conversationId);
          setMessages((prev) => [...prev, { role: 'assistant', content: data.message }]);
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
        },
      },
    );

    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitMessage(input);
    }
  }

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    submitMessage(input);
  }

  return (
    <div className="flex h-[calc(100vh-6rem)] w-[100%] flex-col">
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="flex flex-col gap-4">
          {messages.length === 0 && (
            <p className="text-center text-sm text-muted-foreground">
              Ask me anything about your finances.
            </p>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isPending && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-muted px-4 py-2.5 text-sm text-muted-foreground">
                Thinking…
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t border-border px-4 py-4">
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message…"
            disabled={isPending}
            className="flex-1 max-h-48 resize-none overflow-y-auto rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isPending}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-40"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
