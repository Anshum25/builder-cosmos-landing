import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ChatResponse } from "@shared/api";

interface Msg {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface Ctx {
  sessionId: string;
  messages: Msg[];
  sending: boolean;
  send: (text: string) => Promise<ChatResponse | null>;
}

const ChatContext = createContext<Ctx | null>(null);

function uuid() {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
}

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sessionId, setSessionId] = useState<string>("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [sending, setSending] = useState(false);
  const mounted = useRef(false);

  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;
    const saved = localStorage.getItem("finance.chat.sessionId");
    if (saved) setSessionId(saved);
    else {
      const id = uuid();
      localStorage.setItem("finance.chat.sessionId", id);
      setSessionId(id);
    }
  }, []);

  const send = async (text: string) => {
    if (!text.trim()) return null;
    setSending(true);
    const userMsg: Msg = { id: uuid(), role: "user", content: text };
    setMessages((m) => [...m, userMsg]);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: text }),
      });
      if (!res.ok) throw new Error("Chat failed");
      const data = (await res.json()) as ChatResponse;
      const bot: Msg = { id: uuid(), role: "assistant", content: data.reply };
      setMessages((m) => [...m, bot]);
      return data;
    } catch (e) {
      const bot: Msg = {
        id: uuid(),
        role: "assistant",
        content: "Sorry, I couldn't process that request. Please try again.",
      };
      setMessages((m) => [...m, bot]);
      return null;
    } finally {
      setSending(false);
    }
  };

  const value = useMemo<Ctx>(
    () => ({ sessionId, messages, sending, send }),
    [sessionId, messages, sending],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
};
